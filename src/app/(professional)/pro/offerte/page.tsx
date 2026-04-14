import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { bids, auctions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/pricing';

export default async function MyBidsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const myBids = await db
    .select({ bid: bids, auctionTitle: auctions.title, auctionStatus: auctions.status, maxBudget: auctions.maxBudget, auctionCity: auctions.city })
    .from(bids)
    .innerJoin(auctions, eq(bids.auctionId, auctions.id))
    .where(eq(bids.professionalId, session.user.id))
    .orderBy(desc(bids.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Le mie offerte</h1>
      {myBids.length > 0 ? (
        <div className="space-y-3">
          {myBids.map(b => (
            <Link key={b.bid.id} href={`/aste/${b.bid.auctionId}`} className="card p-4 flex items-center justify-between block hover:border-[var(--primary)]/30">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--foreground)] truncate">{b.auctionTitle}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5 flex gap-3">
                  <span>Budget: {formatCurrency(b.maxBudget)}</span>
                  {b.auctionCity && <span>📍 {b.auctionCity}</span>}
                  <span className={`badge text-[10px] ${b.auctionStatus === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    Asta: {b.auctionStatus}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="font-bold text-lg">{formatCurrency(b.bid.amountCents)}</div>
                <span className={`badge text-[10px] ${
                  b.bid.status === 'accepted' ? 'bg-green-100 text-green-700'
                    : b.bid.status === 'rejected' ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {b.bid.status === 'accepted' ? '🏆 Vinta!' : b.bid.status === 'rejected' ? 'Non accettata' : 'In attesa'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-bold mb-2">Nessuna offerta</h3>
          <p className="text-sm text-[var(--muted)]">Esplora le aste disponibili e inizia a fare offerte</p>
        </div>
      )}
    </div>
  );
}
