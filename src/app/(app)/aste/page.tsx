import { db } from '@/lib/db';
import { auctions, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { AuctionCard } from '@/components/auction/auction-card';

export default async function BrowseAuctionsPage() {
  const activeAuctions = await db
    .select({
      auction: auctions,
      creatorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
      lowestBid: sql<number | null>`(SELECT min(amount_cents) FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions)
    .innerJoin(users, eq(auctions.userId, users.id))
    .where(eq(auctions.status, 'active'))
    .orderBy(desc(auctions.createdAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Aste disponibili</h1>
        <p className="text-[var(--muted)] mt-1">Esplora le aste attive e fai la tua offerta</p>
      </div>

      {activeAuctions.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {activeAuctions.map(a => (
            <AuctionCard
              key={a.auction.id}
              auction={a.auction}
              bidCount={a.bidCount}
              lowestBid={a.lowestBid}
              creatorName={a.creatorName}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-bold mb-2">Nessuna asta attiva</h3>
          <p className="text-sm text-[var(--muted)]">Non ci sono aste attive al momento. Torna piu tardi!</p>
        </div>
      )}
    </div>
  );
}
