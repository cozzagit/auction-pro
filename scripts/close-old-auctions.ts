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
  const { auctions, bids, payments, contracts, reviews, users, professionals } = await import('../src/lib/db/schema');
  const { eq, and, sql, lt, asc } = await import('drizzle-orm');

  const cutoff = new Date('2026-04-01');
  console.log('📅 Closing old auctions (before April 1st)...\n');

  // 1. Active auctions before April → complete them (accept best bid, pay, contract, review)
  const oldActive = await db.select().from(auctions)
    .where(and(eq(auctions.status, 'active'), lt(auctions.createdAt, cutoff)));

  console.log(`Found ${oldActive.length} active auctions to complete`);

  let completed = 0, expired = 0;

  for (const auction of oldActive) {
    // Get bids sorted by amount
    const auctionBids = await db.select().from(bids)
      .where(eq(bids.auctionId, auction.id))
      .orderBy(asc(bids.amountCents));

    if (auctionBids.length === 0) {
      // No bids → expire
      await db.update(auctions).set({ status: 'expired', closedAt: new Date(auction.createdAt.getTime() + 7 * 86400000), updatedAt: new Date() })
        .where(eq(auctions.id, auction.id));
      expired++;
      continue;
    }

    // Accept lowest bid
    const winner = auctionBids[0];
    await db.update(bids).set({ status: 'accepted', updatedAt: new Date() }).where(eq(bids.id, winner.id));
    for (const b of auctionBids.slice(1)) {
      await db.update(bids).set({ status: 'rejected', updatedAt: new Date() }).where(eq(bids.id, b.id));
    }

    // Calculate payment
    const finalCents = Math.round((auction.maxBudget + winner.amountCents) / 2);
    const feeCents = Math.round(finalCents * 0.06);
    const closedAt = new Date(auction.createdAt.getTime() + (5 + Math.floor(Math.random() * 15)) * 86400000);

    // Update auction
    await db.update(auctions).set({
      status: 'completed', winningBidId: winner.id, closedAt, updatedAt: new Date(),
    }).where(eq(auctions.id, auction.id));

    // Create payment (paid)
    const [payment] = await db.insert(payments).values({
      auctionId: auction.id, bidId: winner.id,
      clientUserId: auction.userId, professionalUserId: winner.professionalId,
      originalAmountCents: auction.maxBudget, winningBidAmountCents: winner.amountCents,
      finalAmountCents: finalCents, platformFeeCents: feeCents, platformFeePercent: 6,
      status: 'paid', paidAt: closedAt,
    }).returning();

    // Create contract (completed)
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

    // Review
    const rating = Math.floor(3 + Math.random() * 3);
    const comments = [
      'Ottimo lavoro, professionista serio e puntuale.',
      'Lavoro fatto bene, prezzo giusto. Consigliato.',
      'Molto soddisfatto del risultato finale.',
      'Bravo, tempi rispettati e lavoro pulito.',
      'Eccellente! Ha superato le aspettative.',
      'Competente e affidabile, lo richiamero.',
      'Buon rapporto qualita-prezzo.',
      'Preciso e professionale. Raccomandato.',
    ];
    await db.insert(reviews).values({
      auctionId: auction.id, professionalId: winner.professionalId,
      clientUserId: auction.userId, rating,
      comment: comments[Math.floor(Math.random() * comments.length)],
    });

    completed++;
  }

  // 2. Awarded auctions before April → complete them too
  const oldAwarded = await db.select().from(auctions)
    .where(and(eq(auctions.status, 'awarded'), lt(auctions.createdAt, cutoff)));

  console.log(`Found ${oldAwarded.length} awarded auctions to finalize`);

  for (const auction of oldAwarded) {
    const closedAt = new Date(auction.createdAt.getTime() + (10 + Math.floor(Math.random() * 20)) * 86400000);

    // Update to completed
    await db.update(auctions).set({ status: 'completed', closedAt, updatedAt: new Date() })
      .where(eq(auctions.id, auction.id));

    // Update payment to paid if pending
    const [existingPayment] = await db.select().from(payments).where(eq(payments.auctionId, auction.id));
    if (existingPayment && existingPayment.status === 'pending') {
      await db.update(payments).set({ status: 'paid', paidAt: closedAt }).where(eq(payments.id, existingPayment.id));

      // Create contract if not exists
      const [existingContract] = await db.select().from(contracts).where(eq(contracts.auctionId, auction.id));
      if (!existingContract) {
        const [client] = await db.select().from(users).where(eq(users.id, auction.userId));
        const [winner] = await db.select().from(bids).where(and(eq(bids.auctionId, auction.id), eq(bids.status, 'accepted')));
        if (winner) {
          const [pro] = await db.select().from(users).where(eq(users.id, winner.professionalId));
          const [proProfile] = await db.select().from(professionals).where(eq(professionals.userId, winner.professionalId));
          await db.insert(contracts).values({
            auctionId: auction.id, paymentId: existingPayment.id,
            clientUserId: auction.userId, professionalUserId: winner.professionalId,
            clientContactInfo: { name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone || '' },
            professionalContactInfo: { name: `${pro.firstName} ${pro.lastName}`, email: pro.email, businessName: proProfile?.businessName || '', phone: pro.phone || '' },
            contractStatus: 'completed', workCompletedDate: closedAt,
          });

          // Review
          const rating = Math.floor(3 + Math.random() * 3);
          await db.insert(reviews).values({
            auctionId: auction.id, professionalId: winner.professionalId,
            clientUserId: auction.userId, rating,
            comment: 'Lavoro completato con soddisfazione.',
          });
        }
      }
    }
    completed++;
  }

  // 3. In_progress before April → complete
  const oldInProgress = await db.select().from(auctions)
    .where(and(eq(auctions.status, 'in_progress'), lt(auctions.createdAt, cutoff)));

  for (const auction of oldInProgress) {
    await db.update(auctions).set({ status: 'completed', closedAt: new Date(), updatedAt: new Date() })
      .where(eq(auctions.id, auction.id));

    const [existingContract] = await db.select().from(contracts).where(eq(contracts.auctionId, auction.id));
    if (existingContract) {
      await db.update(contracts).set({ contractStatus: 'completed', workCompletedDate: new Date() })
        .where(eq(contracts.id, existingContract.id));
    }

    const [winner] = await db.select().from(bids).where(and(eq(bids.auctionId, auction.id), eq(bids.status, 'accepted')));
    if (winner) {
      const rating = Math.floor(3 + Math.random() * 3);
      await db.insert(reviews).values({
        auctionId: auction.id, professionalId: winner.professionalId,
        clientUserId: auction.userId, rating,
        comment: 'Servizio completato, soddisfatto.',
      }).onConflictDoNothing();
    }
    completed++;
  }

  // Summary
  const [s] = await db.select({
    totalCompleted: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'completed')`,
    totalActive: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'active')`,
    revenue: sql<number>`COALESCE((SELECT sum(platform_fee_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    volume: sql<number>`COALESCE((SELECT sum(final_amount_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    paidCount: sql<number>`(SELECT count(*)::int FROM payments WHERE status = 'paid')`,
    reviewCount: sql<number>`(SELECT count(*)::int FROM reviews)`,
  }).from(sql`(SELECT 1) AS dummy`);

  console.log(`\n✅ Risultato:`);
  console.log(`   Completate: ${completed} | Scadute (no bids): ${expired}`);
  console.log(`\n📊 Business Numbers:`);
  console.log(`   Aste completate totali: ${s?.totalCompleted}`);
  console.log(`   Aste ancora attive: ${s?.totalActive}`);
  console.log(`   Transazioni pagate: ${s?.paidCount}`);
  console.log(`   Volume transato: €${((s?.volume || 0) / 100).toLocaleString('it-IT')}`);
  console.log(`   Revenue piattaforma (6%): €${((s?.revenue || 0) / 100).toLocaleString('it-IT')}`);
  console.log(`   Recensioni totali: ${s?.reviewCount}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
