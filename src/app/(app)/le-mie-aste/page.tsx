import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auctions, bids } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { AuctionCard } from '@/components/auction/auction-card';
import Link from 'next/link';

export default async function MyAuctionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const myAuctions = await db
    .select({
      auction: auctions,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
      lowestBid: sql<number | null>`(SELECT min(amount_cents) FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions)
    .where(eq(auctions.userId, session.user.id))
    .orderBy(desc(auctions.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Le mie aste</h1>
        <Link href="/aste/nuova" className="btn btn-primary">➕ Nuova asta</Link>
      </div>

      {myAuctions.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {myAuctions.map(a => (
            <AuctionCard
              key={a.auction.id}
              auction={a.auction}
              bidCount={a.bidCount}
              lowestBid={a.lowestBid}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-bold mb-2">Nessuna asta</h3>
          <p className="text-sm text-[var(--muted)] mb-4">Non hai ancora creato nessuna asta</p>
          <Link href="/aste/nuova" className="btn btn-primary">Crea la tua prima asta</Link>
        </div>
      )}
    </div>
  );
}
