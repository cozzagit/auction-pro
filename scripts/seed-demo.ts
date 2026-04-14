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
  const { users, professionals, professionalCategories, categories, services, auctions, auctionServices, bids, payments, contracts, reviews } = await import('../src/lib/db/schema');
  const { hash } = await import('bcryptjs');
  const { eq, sql } = await import('drizzle-orm');

  console.log('🌱 Seeding demo data...\n');

  const passwordHash = await hash('Demo2026!', 12);

  // ── Fetch categories ──
  const cats = await db.select().from(categories);
  const catMap = new Map(cats.map(c => [c.slug, c]));
  const svcs = await db.select().from(services);
  if (cats.length === 0) { console.error('❌ Run seed-categories first!'); process.exit(1); }

  // ── Create 20 customers ──
  console.log('👥 Creating customers...');
  const CUSTOMER_DATA = [
    { firstName: 'Marco', lastName: 'Rossi', city: 'Milano', province: 'MI' },
    { firstName: 'Laura', lastName: 'Bianchi', city: 'Roma', province: 'RM' },
    { firstName: 'Giuseppe', lastName: 'Verdi', city: 'Torino', province: 'TO' },
    { firstName: 'Francesca', lastName: 'Russo', city: 'Napoli', province: 'NA' },
    { firstName: 'Alessandro', lastName: 'Ferrari', city: 'Bologna', province: 'BO' },
    { firstName: 'Chiara', lastName: 'Esposito', city: 'Firenze', province: 'FI' },
    { firstName: 'Luca', lastName: 'Romano', city: 'Bergamo', province: 'BG' },
    { firstName: 'Elena', lastName: 'Colombo', city: 'Brescia', province: 'BS' },
    { firstName: 'Andrea', lastName: 'Ricci', city: 'Padova', province: 'PD' },
    { firstName: 'Valentina', lastName: 'Marino', city: 'Verona', province: 'VR' },
    { firstName: 'Davide', lastName: 'Greco', city: 'Genova', province: 'GE' },
    { firstName: 'Sara', lastName: 'Bruno', city: 'Palermo', province: 'PA' },
    { firstName: 'Matteo', lastName: 'Galli', city: 'Monza', province: 'MB' },
    { firstName: 'Giulia', lastName: 'Costa', city: 'Como', province: 'CO' },
    { firstName: 'Simone', lastName: 'Fontana', city: 'Parma', province: 'PR' },
    { firstName: 'Anna', lastName: 'Conti', city: 'Modena', province: 'MO' },
    { firstName: 'Roberto', lastName: 'Mariani', city: 'Pisa', province: 'PI' },
    { firstName: 'Martina', lastName: 'Rizzo', city: 'Catania', province: 'CT' },
    { firstName: 'Paolo', lastName: 'Lombardi', city: 'Bari', province: 'BA' },
    { firstName: 'Silvia', lastName: 'Moretti', city: 'Lecco', province: 'LC' },
  ];

  const customerIds: string[] = [];
  for (const c of CUSTOMER_DATA) {
    const email = `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@demo.ribasta.it`;
    const [user] = await db.insert(users).values({
      email, passwordHash, firstName: c.firstName, lastName: c.lastName,
      city: c.city, province: c.province, role: 'customer',
    }).onConflictDoNothing().returning();
    if (user) customerIds.push(user.id);
  }
  console.log(`  ✓ ${customerIds.length} clienti creati`);

  // ── Create 15 professionals ──
  console.log('🔧 Creating professionals...');
  const PRO_DATA = [
    { firstName: 'Mario', lastName: 'Electrici', biz: 'Electrici & Figli Srl', vat: 'IT01234567890', city: 'Milano', province: 'MI', cats: ['elettricista'], insurance: true, license: true, exp: '15 anni', desc: 'Elettricista specializzato in impianti civili e industriali. Certificazioni CEI e abilitazione DM 37/08.' },
    { firstName: 'Giovanni', lastName: 'Idraulici', biz: 'Idraulica Rapida', vat: 'IT01234567891', city: 'Milano', province: 'MI', cats: ['idraulica'], insurance: true, license: true, exp: '12 anni', desc: 'Pronto intervento idraulico 24/7. Specializzati in riparazioni e installazioni complete bagno.' },
    { firstName: 'Luigi', lastName: 'Giardini', biz: 'Verde Vivo Giardini', vat: 'IT01234567892', city: 'Monza', province: 'MB', cats: ['giardinaggio'], insurance: true, license: false, exp: '8 anni', desc: 'Progettazione e manutenzione giardini, potature, impianti irrigazione.' },
    { firstName: 'Rosa', lastName: 'Pulito', biz: 'Pulizie Perfette Sas', vat: 'IT01234567893', city: 'Roma', province: 'RM', cats: ['pulizie'], insurance: true, license: false, exp: '10 anni', desc: 'Servizi di pulizia professionale per case, uffici e post-cantiere.' },
    { firstName: 'Franco', lastName: 'Muratore', biz: 'Edil Franco Srl', vat: 'IT01234567894', city: 'Torino', province: 'TO', cats: ['ristrutturazioni'], insurance: true, license: true, exp: '20 anni', desc: 'Ristrutturazioni chiavi in mano, impresa edile con 20 anni di esperienza.' },
    { firstName: 'Antonio', lastName: 'Clima', biz: 'ClimaTop Srl', vat: 'IT01234567895', city: 'Bologna', province: 'BO', cats: ['climatizzazione'], insurance: true, license: true, exp: '10 anni', desc: 'Installazione e manutenzione climatizzatori, pompe di calore, VMC.' },
    { firstName: 'Teresa', lastName: 'Fit', biz: 'FitLife Personal Training', vat: 'IT01234567896', city: 'Firenze', province: 'FI', cats: ['fitness'], insurance: true, license: true, exp: '6 anni', desc: 'Personal trainer certificata CONI. Programmi personalizzati a domicilio.' },
    { firstName: 'Marco', lastName: 'Tech', biz: 'TechAssist Italia', vat: 'IT01234567897', city: 'Milano', province: 'MI', cats: ['informatica'], insurance: false, license: false, exp: '8 anni', desc: 'Assistenza informatica, riparazione PC e Mac, configurazione reti.' },
    { firstName: 'Carla', lastName: 'Foto', biz: 'Carla Foto Studio', vat: 'IT01234567898', city: 'Roma', province: 'RM', cats: ['fotografia'], insurance: true, license: false, exp: '12 anni', desc: 'Fotografa professionista per matrimoni, eventi, ritratti e aziende.' },
    { firstName: 'Piero', lastName: 'Trasloco', biz: 'Traslochi Express', vat: 'IT01234567899', city: 'Napoli', province: 'NA', cats: ['traslochi'], insurance: true, license: false, exp: '15 anni', desc: 'Traslochi nazionali e internazionali, smontaggio mobili, deposito.' },
    { firstName: 'Lucia', lastName: 'Baby', biz: 'Lucia Babysitting', vat: 'IT01234567900', city: 'Bergamo', province: 'BG', cats: ['babysitter'], insurance: true, license: true, exp: '5 anni', desc: 'Babysitter certificata con esperienza in pedagogia infantile.' },
    { firstName: 'Stefano', lastName: 'Consulto', biz: 'Studio Consulenze Legali', vat: 'IT01234567901', city: 'Milano', province: 'MI', cats: ['consulenze'], insurance: true, license: true, exp: '18 anni', desc: 'Consulenze legali, fiscali e amministrative per privati e aziende.' },
    { firstName: 'Elisa', lastName: 'Benesse', biz: 'Oasi del Benessere', vat: 'IT01234567902', city: 'Verona', province: 'VR', cats: ['benessere'], insurance: true, license: true, exp: '7 anni', desc: 'Massaggi professionali, riflessologia, trattamenti olistici a domicilio.' },
    { firstName: 'Claudio', lastName: 'Sicuro', biz: 'SecurHome Srl', vat: 'IT01234567903', city: 'Padova', province: 'PD', cats: ['sicurezza'], insurance: true, license: true, exp: '14 anni', desc: 'Sistemi di allarme, videosorveglianza, controllo accessi, domotica.' },
    { firstName: 'Federica', lastName: 'Cucina', biz: 'Chef a Domicilio', vat: 'IT01234567904', city: 'Firenze', province: 'FI', cats: ['catering'], insurance: true, license: true, exp: '9 anni', desc: 'Catering per eventi, cene private, servizio chef a domicilio.' },
  ];

  const proUserIds: string[] = [];
  for (const p of PRO_DATA) {
    const email = `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@pro.ribasta.it`;
    const [user] = await db.insert(users).values({
      email, passwordHash, firstName: p.firstName, lastName: p.lastName,
      city: p.city, province: p.province, phone: `+39 ${String(Math.floor(300000000 + Math.random() * 99999999)).padStart(10, '0')}`,
      role: 'professional',
    }).onConflictDoNothing().returning();
    if (!user) continue;
    proUserIds.push(user.id);

    const rating = +(3.5 + Math.random() * 1.5).toFixed(2);
    const totalJobs = Math.floor(5 + Math.random() * 80);
    const [pro] = await db.insert(professionals).values({
      userId: user.id, businessName: p.biz, vatNumber: p.vat,
      city: p.city, province: p.province, description: p.desc,
      experience: p.exp, hasInsurance: p.insurance, hasLicense: p.license,
      status: 'approved', rating, totalJobs,
    }).onConflictDoNothing().returning();

    if (pro) {
      for (const catSlug of p.cats) {
        const cat = catMap.get(catSlug);
        if (cat) {
          await db.insert(professionalCategories).values({ professionalId: pro.id, categoryId: cat.id }).onConflictDoNothing();
        }
      }
    }
  }
  console.log(`  ✓ ${proUserIds.length} professionisti creati (tutti approvati)`);

  // ── Create 100 auctions ──
  console.log('📋 Creating auctions...');
  const AUCTION_TEMPLATES = [
    { title: 'Rifacimento impianto elettrico appartamento', catSlug: 'elettricista', budget: [800, 5000], desc: 'Necessito di rifare completamente l\'impianto elettrico del mio appartamento di {mq} mq. Serve certificazione di conformita.' },
    { title: 'Installazione punti luce e prese', catSlug: 'elettricista', budget: [200, 800], desc: 'Devo installare nuovi punti luce e prese elettriche in {rooms} stanze. Preferibilmente con placche moderne.' },
    { title: 'Riparazione perdita bagno', catSlug: 'idraulica', budget: [150, 600], desc: 'Ho una perdita d\'acqua nel bagno principale, probabilmente dalla tubatura sotto il lavabo. Serve intervento urgente.' },
    { title: 'Ristrutturazione bagno completa', catSlug: 'idraulica', budget: [3000, 8000], desc: 'Voglio rifare completamente il bagno: sanitari, piatto doccia, piastrelle, rubinetteria. Misure: {mq} mq.' },
    { title: 'Manutenzione giardino mensile', catSlug: 'giardinaggio', budget: [100, 400], desc: 'Cerco giardiniere per manutenzione mensile del giardino di {mq} mq. Taglio erba, potatura siepi, pulizia.' },
    { title: 'Progettazione giardino con irrigazione', catSlug: 'giardinaggio', budget: [1500, 5000], desc: 'Devo progettare il giardino della nuova casa ({mq} mq) con impianto di irrigazione automatico e piantumazione.' },
    { title: 'Pulizia appartamento post trasloco', catSlug: 'pulizie', budget: [150, 500], desc: 'Appartamento di {rooms} locali da pulire a fondo dopo trasloco. Incluso pulizia vetri e sanitari.' },
    { title: 'Pulizia ufficio settimanale', catSlug: 'pulizie', budget: [200, 600], desc: 'Cerco servizio di pulizia settimanale per ufficio di {mq} mq. Aspirazione, bagni, scrivania, cucina.' },
    { title: 'Ristrutturazione cucina', catSlug: 'ristrutturazioni', budget: [5000, 15000], desc: 'Devo rifare la cucina: demolizione, impianti, piastrelle, montaggio mobili. Superficie circa {mq} mq.' },
    { title: 'Tinteggiatura appartamento', catSlug: 'ristrutturazioni', budget: [800, 3000], desc: 'Tinteggiatura completa appartamento {rooms} locali. Pareti e soffitti, preparazione superfici.' },
    { title: 'Installazione climatizzatore', catSlug: 'climatizzazione', budget: [600, 2000], desc: 'Installazione climatizzatore dual split per {rooms} stanze. Preferibilmente classe energetica A+++.' },
    { title: 'Personal trainer a domicilio', catSlug: 'fitness', budget: [200, 600], desc: 'Cerco personal trainer per {sessions} sessioni settimanali a domicilio. Obiettivo: tonificazione e perdita peso.' },
    { title: 'Riparazione PC lento', catSlug: 'informatica', budget: [50, 200], desc: 'Il mio PC e diventato molto lento. Serve diagnosi, pulizia software, eventuale upgrade RAM/SSD.' },
    { title: 'Servizio fotografico matrimonio', catSlug: 'fotografia', budget: [1000, 3000], desc: 'Cerco fotografo per il mio matrimonio il {date}. Cerimonia e ricevimento, circa 8 ore di servizio.' },
    { title: 'Trasloco appartamento bilocale', catSlug: 'traslochi', budget: [400, 1200], desc: 'Trasloco da {from} a {to}. Bilocale con mobili standard, 3° piano con ascensore.' },
    { title: 'Babysitter per weekend', catSlug: 'babysitter', budget: [80, 200], desc: 'Cerco babysitter per sabato sera dalle 19 alle 23. Bambino di {age} anni, zona {city}.' },
    { title: 'Consulenza fiscale partita IVA', catSlug: 'consulenze', budget: [100, 400], desc: 'Devo aprire partita IVA come freelancer. Cerco commercialista per consulenza su regime fiscale e adempimenti.' },
    { title: 'Massaggio rilassante a domicilio', catSlug: 'benessere', budget: [50, 150], desc: 'Cerco massaggiatore/trice per sessione di massaggio rilassante a domicilio di {duration} minuti.' },
    { title: 'Installazione allarme casa', catSlug: 'sicurezza', budget: [500, 2000], desc: 'Installazione sistema di allarme per villetta: sensori porte/finestre, sirena, telecomando, app smartphone.' },
    { title: 'Catering per festa compleanno', catSlug: 'catering', budget: [300, 1500], desc: 'Catering per festa di compleanno, {guests} invitati. Buffet finger food + torta + bevande.' },
  ];

  const STATUSES: Array<{ status: 'active' | 'expired' | 'awarded' | 'completed' | 'in_progress'; weight: number }> = [
    { status: 'active', weight: 35 },
    { status: 'expired', weight: 10 },
    { status: 'awarded', weight: 15 },
    { status: 'in_progress', weight: 15 },
    { status: 'completed', weight: 25 },
  ];

  function pickStatus(): 'active' | 'expired' | 'awarded' | 'completed' | 'in_progress' {
    const total = STATUSES.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const s of STATUSES) {
      r -= s.weight;
      if (r <= 0) return s.status;
    }
    return 'active';
  }

  const cities = CUSTOMER_DATA.map(c => ({ city: c.city, province: c.province }));
  const auctionIds: Array<{ id: string; userId: string; maxBudget: number; status: string }> = [];

  for (let i = 0; i < 100; i++) {
    const tmpl = AUCTION_TEMPLATES[i % AUCTION_TEMPLATES.length];
    const customer = customerIds[i % customerIds.length];
    const loc = cities[Math.floor(Math.random() * cities.length)];
    const budgetRange = tmpl.budget;
    const budgetEur = Math.round(budgetRange[0] + Math.random() * (budgetRange[1] - budgetRange[0]));
    const budgetCents = budgetEur * 100;

    const status = pickStatus();
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    let expiresAt: Date;
    if (status === 'active') {
      expiresAt = new Date(Date.now() + (1 + Math.floor(Math.random() * 6)) * 24 * 60 * 60 * 1000);
    } else if (status === 'expired') {
      expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const desc = tmpl.desc
      .replace('{mq}', String(30 + Math.floor(Math.random() * 120)))
      .replace('{rooms}', String(2 + Math.floor(Math.random() * 4)))
      .replace('{sessions}', String(2 + Math.floor(Math.random() * 3)))
      .replace('{date}', '15 giugno 2026')
      .replace('{from}', loc.city)
      .replace('{to}', cities[Math.floor(Math.random() * cities.length)].city)
      .replace('{age}', String(2 + Math.floor(Math.random() * 8)))
      .replace('{city}', loc.city)
      .replace('{duration}', String([60, 90, 120][Math.floor(Math.random() * 3)]))
      .replace('{guests}', String(20 + Math.floor(Math.random() * 50)));

    const title = tmpl.title + (i > AUCTION_TEMPLATES.length ? ` #${Math.floor(i / AUCTION_TEMPLATES.length) + 1}` : '');

    const [auction] = await db.insert(auctions).values({
      userId: customer,
      title,
      description: desc,
      maxBudget: budgetCents,
      city: loc.city,
      province: loc.province,
      status,
      expiresAt,
      createdAt,
      updatedAt: createdAt,
      ...(status === 'completed' ? { closedAt: new Date(createdAt.getTime() + (3 + Math.floor(Math.random() * 20)) * 24 * 60 * 60 * 1000) } : {}),
    }).returning();

    // Link to a service
    const cat = catMap.get(tmpl.catSlug);
    const catServices = svcs.filter(s => cat && s.categoryId === cat.id);
    if (catServices.length > 0) {
      const svc = catServices[Math.floor(Math.random() * catServices.length)];
      await db.insert(auctionServices).values({ auctionId: auction.id, serviceId: svc.id, parameters: {} });
    }

    auctionIds.push({ id: auction.id, userId: customer, maxBudget: budgetCents, status });
  }
  console.log(`  ✓ 100 aste create`);

  // ── Create bids (2-6 per auction, except expired with few) ──
  console.log('💰 Creating bids...');
  let bidCount = 0;
  let paymentCount = 0;
  let contractCount = 0;
  let reviewCount = 0;

  for (const auction of auctionIds) {
    const numBids = auction.status === 'expired' ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 5);
    const shuffledPros = [...proUserIds].sort(() => Math.random() - 0.5);
    let lowestBidId: string | null = null;
    let lowestAmount = Infinity;

    for (let b = 0; b < Math.min(numBids, shuffledPros.length); b++) {
      const proId = shuffledPros[b];
      // Bid between 50% and 95% of budget
      const bidPercent = 0.5 + Math.random() * 0.45;
      const amountCents = Math.round(auction.maxBudget * bidPercent);
      const bidStatus = (auction.status === 'awarded' || auction.status === 'in_progress' || auction.status === 'completed')
        ? (amountCents < lowestAmount ? 'accepted' : 'rejected')
        : 'pending';

      const [bid] = await db.insert(bids).values({
        auctionId: auction.id, professionalId: proId,
        amountCents, message: b === 0 ? 'Disponibile subito, esperienza pluriennale nel settore.' : (b === 1 ? 'Offro servizio completo con garanzia.' : null),
        status: 'pending', // will update the winner below
      }).returning();

      if (amountCents < lowestAmount) {
        lowestAmount = amountCents;
        lowestBidId = bid.id;
      }
      bidCount++;
    }

    // For awarded/in_progress/completed: accept the lowest bid and create payment/contract
    if (lowestBidId && ['awarded', 'in_progress', 'completed'].includes(auction.status)) {
      // Accept lowest
      await db.update(bids).set({ status: 'accepted' }).where(eq(bids.id, lowestBidId));
      // Reject others
      const allAuctionBids = await db.select().from(bids).where(eq(bids.auctionId, auction.id));
      for (const ab of allAuctionBids) {
        if (ab.id !== lowestBidId && ab.status === 'pending') {
          await db.update(bids).set({ status: 'rejected' }).where(eq(bids.id, ab.id));
        }
      }

      // Update auction
      await db.update(auctions).set({ winningBidId: lowestBidId }).where(eq(auctions.id, auction.id));

      // Create payment
      const finalAmountCents = Math.round((auction.maxBudget + lowestAmount) / 2);
      const platformFeeCents = Math.round(finalAmountCents * 0.06);
      const [acceptedBid] = await db.select().from(bids).where(eq(bids.id, lowestBidId));

      const isPaid = ['in_progress', 'completed'].includes(auction.status);
      const [payment] = await db.insert(payments).values({
        auctionId: auction.id, bidId: lowestBidId,
        clientUserId: auction.userId, professionalUserId: acceptedBid.professionalId,
        originalAmountCents: auction.maxBudget, winningBidAmountCents: lowestAmount,
        finalAmountCents, platformFeeCents, platformFeePercent: 6,
        status: isPaid ? 'paid' : 'pending',
        ...(isPaid ? { paidAt: new Date() } : {}),
      }).returning();
      paymentCount++;

      // Create contract for paid ones
      if (isPaid) {
        const [client] = await db.select().from(users).where(eq(users.id, auction.userId));
        const [pro] = await db.select().from(users).where(eq(users.id, acceptedBid.professionalId));
        const [proProfile] = await db.select().from(professionals).where(eq(professionals.userId, acceptedBid.professionalId));

        await db.insert(contracts).values({
          auctionId: auction.id, paymentId: payment.id,
          clientUserId: auction.userId, professionalUserId: acceptedBid.professionalId,
          clientContactInfo: { name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone || '' },
          professionalContactInfo: { name: `${pro.firstName} ${pro.lastName}`, email: pro.email, businessName: proProfile?.businessName || '', phone: pro.phone || '' },
          contractStatus: auction.status === 'completed' ? 'completed' : 'active',
          ...(auction.status === 'completed' ? { workCompletedDate: new Date() } : {}),
        });
        contractCount++;

        // Reviews for completed
        if (auction.status === 'completed') {
          const rating = Math.floor(3 + Math.random() * 3); // 3-5
          const comments = [
            'Ottimo lavoro, professionista serio e puntuale.',
            'Lavoro fatto bene, prezzo giusto. Consigliato.',
            'Molto soddisfatto, super preciso e pulito.',
            'Buon lavoro, tempi rispettati. Bravo.',
            'Eccellente! Ha superato le aspettative.',
            'Professionista competente, lo richiamero sicuramente.',
          ];
          await db.insert(reviews).values({
            auctionId: auction.id,
            professionalId: acceptedBid.professionalId,
            clientUserId: auction.userId,
            rating,
            comment: comments[Math.floor(Math.random() * comments.length)],
          });
          reviewCount++;
        }
      }
    }
  }

  console.log(`  ✓ ${bidCount} offerte create`);
  console.log(`  ✓ ${paymentCount} pagamenti creati`);
  console.log(`  ✓ ${contractCount} contratti creati`);
  console.log(`  ✓ ${reviewCount} recensioni create`);

  // Summary
  const [summary] = await db.select({
    totalUsers: sql<number>`(SELECT count(*)::int FROM users)`,
    totalPros: sql<number>`(SELECT count(*)::int FROM professionals)`,
    totalAuctions: sql<number>`(SELECT count(*)::int FROM auctions)`,
    totalBids: sql<number>`(SELECT count(*)::int FROM bids)`,
    totalPayments: sql<number>`(SELECT count(*)::int FROM payments)`,
    totalRevenue: sql<number>`COALESCE((SELECT sum(platform_fee_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    totalVolume: sql<number>`COALESCE((SELECT sum(final_amount_cents)::int FROM payments WHERE status = 'paid'), 0)`,
  }).from(sql`(SELECT 1) AS dummy`);

  console.log(`\n📊 Riepilogo:`);
  console.log(`   Utenti: ${summary?.totalUsers}`);
  console.log(`   Professionisti: ${summary?.totalPros}`);
  console.log(`   Aste: ${summary?.totalAuctions}`);
  console.log(`   Offerte: ${summary?.totalBids}`);
  console.log(`   Pagamenti: ${summary?.totalPayments}`);
  console.log(`   Volume transato: €${((summary?.totalVolume || 0) / 100).toLocaleString('it-IT')}`);
  console.log(`   Revenue piattaforma (6%): €${((summary?.totalRevenue || 0) / 100).toLocaleString('it-IT')}`);
  console.log(`\n✅ Demo seed completato!`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
