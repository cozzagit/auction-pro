import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auctions, bids } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const role = session.user.role;

  if (role === 'professional') redirect('/pro/dashboard');
  if (role === 'admin') redirect('/admin');

  const myAuctions = await db
    .select()
    .from(auctions)
    .where(eq(auctions.userId, userId))
    .orderBy(desc(auctions.createdAt))
    .limit(10);

  const activeCount = myAuctions.filter(a => a.status === 'active').length;
  const completedCount = myAuctions.filter(a => a.status === 'completed').length;

  // Count total bids on user's auctions
  const bidCounts = await db
    .select({ auctionId: bids.auctionId, count: sql<number>`count(*)::int` })
    .from(bids)
    .where(sql`${bids.auctionId} IN (SELECT id FROM auctions WHERE user_id = ${userId})`)
    .groupBy(bids.auctionId);
  const bidMap = new Map(bidCounts.map(b => [b.auctionId, b.count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            Ciao, {session.user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-[var(--muted)] mt-1">Ecco la tua situazione su Ribasta</p>
        </div>
        <Link href="/aste/nuova" className="btn btn-primary">
          ➕ Nuova Asta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--primary)]">{myAuctions.length}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Aste totali</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--accent)]">{activeCount}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Aste attive</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--success)]">{completedCount}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Completate</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--foreground)]">
            {bidCounts.reduce((s, b) => s + b.count, 0)}
          </div>
          <div className="text-sm text-[var(--muted)] mt-1">Offerte ricevute</div>
        </div>
      </div>

      {/* Recent auctions */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Le tue aste recenti</h2>
        {myAuctions.length > 0 ? (
          <div className="space-y-3">
            {myAuctions.map((auction) => (
              <Link key={auction.id} href={`/aste/${auction.id}`} className="card p-4 flex items-center justify-between hover:border-[var(--primary)]/30 transition-colors block">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--foreground)] truncate">{auction.title}</div>
                  <div className="text-sm text-[var(--muted)] mt-0.5 flex items-center gap-3">
                    <span>Budget: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(auction.maxBudget / 100)}</span>
                    {auction.city && <span>{auction.city}</span>}
                    <span>{bidMap.get(auction.id) || 0} offerte</span>
                  </div>
                </div>
                <span className={`badge ${
                  auction.status === 'active' ? 'bg-blue-100 text-blue-700'
                    : auction.status === 'completed' ? 'bg-green-100 text-green-700'
                    : auction.status === 'awarded' ? 'bg-amber-100 text-amber-700'
                    : auction.status === 'expired' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {auction.status === 'active' ? 'Attiva' : auction.status === 'completed' ? 'Completata' : auction.status === 'awarded' ? 'Assegnata' : auction.status === 'expired' ? 'Scaduta' : auction.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Nessuna asta ancora</h3>
            <p className="text-sm text-[var(--muted)] mb-4">Pubblica la tua prima asta e inizia a ricevere offerte dai professionisti</p>
            <Link href="/aste/nuova" className="btn btn-primary">Crea la tua prima asta</Link>
          </div>
        )}
      </div>
    </div>
  );
}
