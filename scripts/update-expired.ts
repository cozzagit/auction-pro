import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) process.env[t.substring(0, i)] = t.substring(i + 1);
  }
} catch { /* */ }

async function main() {
  const { db } = await import('../src/lib/db');
  const { auctions, bids, payments, contracts, reviews, users, professionals, categories, auctionServices, services } = await import('../src/lib/db/schema');
  const { eq, and, sql, lt, asc } = await import('drizzle-orm');

  console.log('🔄 Updating expired auctions to match today...\n');

  // 1. Active auctions with past expiresAt → complete (or expire if no bids)
  const expiredActive = await db.select().from(auctions)
    .where(and(eq(auctions.status, 'active'), lt(auctions.expiresAt, new Date())));

  console.log(`Found ${expiredActive.length} active auctions past expiry`);

  let completed = 0, expired = 0;

  for (const auction of expiredActive) {
    const auctionBids = await db.select().from(bids)
      .where(eq(bids.auctionId, auction.id))
      .orderBy(asc(bids.amountCents));

    if (auctionBids.length === 0) {
      await db.update(auctions).set({ status: 'expired', closedAt: auction.expiresAt, updatedAt: new Date() })
        .where(eq(auctions.id, auction.id));
      expired++;
      continue;
    }

    // Accept best bid → complete
    const winner = auctionBids[0];
    await db.update(bids).set({ status: 'accepted', updatedAt: new Date() }).where(eq(bids.id, winner.id));
    for (const b of auctionBids.slice(1)) {
      await db.update(bids).set({ status: 'rejected', updatedAt: new Date() }).where(eq(bids.id, b.id));
    }

    const finalCents = Math.round((auction.maxBudget + winner.amountCents) / 2);
    const feeCents = Math.round(finalCents * 0.06);
    const closedAt = new Date(auction.expiresAt!.getTime() + Math.random() * 3 * 86400000);

    await db.update(auctions).set({
      status: 'completed', winningBidId: winner.id, closedAt, updatedAt: new Date(),
    }).where(eq(auctions.id, auction.id));

    const [payment] = await db.insert(payments).values({
      auctionId: auction.id, bidId: winner.id,
      clientUserId: auction.userId, professionalUserId: winner.professionalId,
      originalAmountCents: auction.maxBudget, winningBidAmountCents: winner.amountCents,
      finalAmountCents: finalCents, platformFeeCents: feeCents, platformFeePercent: 6,
      status: 'paid', paidAt: closedAt,
    }).returning();

    const [client] = await db.select().from(users).where(eq(users.id, auction.userId));
    const [pro] = await db.select().from(users).where(eq(users.id, winner.professionalId));
    const [proProfile] = await db.select().from(professionals).where(eq(professionals.userId, winner.professionalId));

    await db.insert(contracts).values({
      auctionId: auction.id, paymentId: payment.id,
      clientUserId: auction.userId, professionalUserId: winner.professionalId,
      clientContactInfo: { name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone || '' },
      professionalContactInfo: { name: `${pro.firstName} ${pro.lastName}`, email: pro.email, businessName: proProfile?.businessName || '', phone: pro.phone || '' },
      contractStatus: 'completed', workCompletedDate: closedAt,
    });

    const rating = Math.floor(3 + Math.random() * 3);
    const comments = ['Servizio impeccabile.', 'Bravissimo, tempi rispettati.', 'Molto professionale, consigliato.', 'Lavoro pulito e preciso.', 'Ottima esperienza.'];
    await db.insert(reviews).values({
      auctionId: auction.id, professionalId: winner.professionalId,
      clientUserId: auction.userId, rating, comment: comments[Math.floor(Math.random() * comments.length)],
    });

    completed++;
  }

  // 2. Awarded/in_progress with past expiry → complete
  const oldAwarded = await db.select().from(auctions)
    .where(and(sql`status IN ('awarded', 'in_progress')`, lt(auctions.expiresAt, new Date())));

  for (const auction of oldAwarded) {
    const closedAt = new Date();
    await db.update(auctions).set({ status: 'completed', closedAt, updatedAt: new Date() })
      .where(eq(auctions.id, auction.id));

    const [existingPayment] = await db.select().from(payments).where(eq(payments.auctionId, auction.id));
    if (existingPayment && existingPayment.status === 'pending') {
      await db.update(payments).set({ status: 'paid', paidAt: closedAt }).where(eq(payments.id, existingPayment.id));
    }

    const [existingContract] = await db.select().from(contracts).where(eq(contracts.auctionId, auction.id));
    if (existingContract && existingContract.contractStatus !== 'completed') {
      await db.update(contracts).set({ contractStatus: 'completed', workCompletedDate: closedAt }).where(eq(contracts.id, existingContract.id));
    }

    // Add review if not exists
    const [winner] = await db.select().from(bids).where(and(eq(bids.auctionId, auction.id), eq(bids.status, 'accepted')));
    if (winner) {
      const [existing] = await db.select().from(reviews).where(eq(reviews.auctionId, auction.id));
      if (!existing) {
        const rating = Math.floor(3 + Math.random() * 3);
        await db.insert(reviews).values({
          auctionId: auction.id, professionalId: winner.professionalId,
          clientUserId: auction.userId, rating, comment: 'Completato con successo.',
        });
      }
    }
    completed++;
  }

  // 3. Create 15 NEW active auctions with future expiry + bids
  console.log('\n➕ Creating 15 new active auctions (April 20 - April 27)...');

  const customers = await db.select().from(users).where(eq(users.role, 'customer'));
  const catMap = new Map((await db.select().from(categories)).map(c => [c.slug, c]));
  const allSvcs = await db.select().from(services);
  const proByCat = new Map<string, string[]>();
  const allProCats = await db.select({ userId: professionals.userId, catId: professionals.id }).from(professionals).innerJoin(users, eq(professionals.userId, users.id));

  // Build proByCat from professional_categories junction
  const { professionalCategories } = await import('../src/lib/db/schema');
  const proCatJunction = await db.select({ proUserId: professionals.userId, catId: professionalCategories.categoryId, catSlug: categories.slug })
    .from(professionalCategories)
    .innerJoin(professionals, eq(professionalCategories.professionalId, professionals.id))
    .innerJoin(categories, eq(professionalCategories.categoryId, categories.id));

  for (const pc of proCatJunction) {
    if (!proByCat.has(pc.catSlug)) proByCat.set(pc.catSlug, []);
    proByCat.get(pc.catSlug)!.push(pc.proUserId);
  }

  const NEW_TEMPLATES = [
    { title: 'Installazione lampadari in soggiorno', catSlug: 'elettricista', budget: [200, 500], desc: 'Installare 3 lampadari moderni nel soggiorno.' },
    { title: 'Riparazione scarico lavandino cucina', catSlug: 'idraulica', budget: [80, 250], desc: 'Scarico intasato, serve intervento rapido.' },
    { title: 'Pulizia primaverile giardino 80mq', catSlug: 'giardinaggio', budget: [150, 400], desc: 'Pulizia completa giardino dopo inverno, taglio erba e siepi.' },
    { title: 'Pulizia appartamento vacanze', catSlug: 'pulizie', budget: [100, 300], desc: 'Pulizia profonda casa vacanze prima stagione estiva.' },
    { title: 'Tinteggiatura camera da letto', catSlug: 'ristrutturazioni', budget: [300, 800], desc: 'Tinteggiare camera da letto con pittura lavabile.' },
    { title: 'Manutenzione climatizzatore pre-estate', catSlug: 'climatizzazione', budget: [100, 250], desc: 'Pulizia filtri e controllo gas climatizzatore.' },
    { title: 'Personal trainer prep estate', catSlug: 'fitness', budget: [300, 700], desc: 'Programma 8 settimane, 3 sessioni a settimana, prep estate.' },
    { title: 'Sostituzione hard disk SSD laptop', catSlug: 'informatica', budget: [80, 200], desc: 'Clonare disco, installare SSD nuovo, migrare dati.' },
    { title: 'Shooting foto book personale', catSlug: 'fotografia', budget: [200, 600], desc: 'Book fotografico professionale, 20 foto ritoccate.' },
    { title: 'Trasloco studio piccolo', catSlug: 'traslochi', budget: [250, 600], desc: 'Trasloco studio legale, scrivanie e archivi.' },
    { title: 'Babysitter serale 3 sere', catSlug: 'babysitter', budget: [100, 200], desc: 'Babysitter 3 sere a settimana dalle 20 alle 23.' },
    { title: 'Consulenza dichiarazione redditi', catSlug: 'consulenze', budget: [100, 300], desc: 'Dichiarazione redditi modello unico PF.' },
    { title: 'Massaggio decontratturante cervicale', catSlug: 'benessere', budget: [50, 120], desc: 'Massaggio cervicale decontratturante a domicilio.' },
    { title: 'Installazione telecamere esterno', catSlug: 'sicurezza', budget: [400, 1200], desc: 'Installare 4 telecamere esterne con DVR.' },
    { title: 'Catering cena aziendale 15 persone', catSlug: 'catering', budget: [400, 900], desc: 'Cena aziendale per 15 persone, menu business.' },
  ];

  const cities = [{city: 'Milano', province: 'MI'}, {city: 'Roma', province: 'RM'}, {city: 'Torino', province: 'TO'}, {city: 'Bologna', province: 'BO'}, {city: 'Firenze', province: 'FI'}, {city: 'Bergamo', province: 'BG'}];

  let newAuctionsCreated = 0, newBidsCreated = 0;

  for (const tmpl of NEW_TEMPLATES) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const loc = cities[Math.floor(Math.random() * cities.length)];
    const budgetEur = Math.round(tmpl.budget[0] + Math.random() * (tmpl.budget[1] - tmpl.budget[0]));
    // Created 1-4 days ago
    const createdAt = new Date(Date.now() - (1 + Math.random() * 4) * 86400000);
    // Expires 2-7 days in the future
    const expiresAt = new Date(Date.now() + (2 + Math.random() * 5) * 86400000);

    const [auction] = await db.insert(auctions).values({
      userId: customer.id, title: tmpl.title, description: tmpl.desc,
      maxBudget: budgetEur * 100, city: loc.city, province: loc.province,
      status: 'active', expiresAt, createdAt, updatedAt: createdAt,
    }).returning();

    const cat = catMap.get(tmpl.catSlug);
    const catSvcs = allSvcs.filter(s => cat && s.categoryId === cat.id);
    if (catSvcs.length > 0) {
      await db.insert(auctionServices).values({
        auctionId: auction.id, serviceId: catSvcs[Math.floor(Math.random() * catSvcs.length)].id, parameters: {},
      });
    }

    // Add 1-4 bids from matching category pros
    const matchingPros = proByCat.get(tmpl.catSlug) || [];
    const numBids = Math.min(matchingPros.length, 1 + Math.floor(Math.random() * 4));
    const shuffled = [...matchingPros].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numBids; i++) {
      const bidPercent = 0.55 + Math.random() * 0.35; // 55-90% del budget
      const bidCents = Math.round(auction.maxBudget * bidPercent);
      const msgs = [
        'Disponibile da subito, prezzo competitivo.',
        'Esperienza nel settore, offerta con tutto incluso.',
        'Posso iniziare entro la settimana.',
        null,
      ];
      await db.insert(bids).values({
        auctionId: auction.id, professionalId: shuffled[i],
        amountCents: bidCents, message: msgs[Math.floor(Math.random() * msgs.length)],
        status: 'pending',
        createdAt: new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())),
      });
      newBidsCreated++;
    }
    newAuctionsCreated++;
  }

  console.log(`  ✓ ${newAuctionsCreated} nuove aste attive create con ${newBidsCreated} offerte`);

  const [s] = await db.select({
    active: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'active')`,
    completed: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'completed')`,
    total: sql<number>`(SELECT count(*)::int FROM auctions)`,
    revenue: sql<number>`COALESCE((SELECT sum(platform_fee_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    volume: sql<number>`COALESCE((SELECT sum(final_amount_cents)::int FROM payments WHERE status = 'paid'), 0)`,
  }).from(sql`(SELECT 1) AS dummy`);

  console.log(`\n📊 Final:`);
  console.log(`   Attive: ${s?.active} | Completate: ${s?.completed} | Totale: ${s?.total}`);
  console.log(`   Volume: €${((s?.volume || 0) / 100).toLocaleString('it-IT')} | Revenue: €${((s?.revenue || 0) / 100).toLocaleString('it-IT')}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
