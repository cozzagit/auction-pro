import { db } from '@/lib/db';
import { auctions, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/pricing';

export default async function AdminAuctionsPage() {
  const allAuctions = await db
    .select({
      auction: auctions,
      creatorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions)
    .innerJoin(users, eq(auctions.userId, users.id))
    .orderBy(desc(auctions.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Gestione Aste ({allAuctions.length})</h1>
      <div className="space-y-2">
        {allAuctions.map(a => (
          <div key={a.auction.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{a.auction.title}</div>
              <div className="text-xs text-[var(--muted)]">{a.creatorName} — {a.auction.city} — {formatCurrency(a.auction.maxBudget)} — {a.bidCount} offerte</div>
            </div>
            <span className={`badge ${a.auction.status === 'active' ? 'bg-blue-100 text-blue-700' : a.auction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {a.auction.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
