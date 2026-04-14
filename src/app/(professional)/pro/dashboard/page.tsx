import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auctions, bids, professionals, professionalCategories, categories } from '@/lib/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/pricing';
import { AuctionCard } from '@/components/auction/auction-card';

export default async function ProDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  // Get professional profile
  const [pro] = await db.select().from(professionals).where(eq(professionals.userId, userId));

  // Get my bids
  const myBids = await db
    .select({ bid: bids, auctionTitle: auctions.title, auctionStatus: auctions.status, maxBudget: auctions.maxBudget })
    .from(bids)
    .innerJoin(auctions, eq(bids.auctionId, auctions.id))
    .where(eq(bids.professionalId, userId))
    .orderBy(desc(bids.createdAt))
    .limit(10);

  const acceptedBids = myBids.filter(b => b.bid.status === 'accepted');
  const totalEarnings = acceptedBids.reduce((s, b) => s + b.bid.amountCents, 0);
  const winRate = myBids.length > 0 ? Math.round((acceptedBids.length / myBids.length) * 100) : 0;

  // Get available auctions matching categories
  let availableAuctions: Array<{
    id: string; title: string; maxBudget: number; status: string;
    city: string | null; province: string | null; expiresAt: Date | null; createdAt: Date;
  }> = [];

  if (pro) {
    const myCatIds = await db
      .select({ categoryId: professionalCategories.categoryId })
      .from(professionalCategories)
      .where(eq(professionalCategories.professionalId, pro.id));

    if (myCatIds.length > 0) {
      // Get auctions in my categories that I haven't bid on
      availableAuctions = await db
        .select()
        .from(auctions)
        .where(
          and(
            eq(auctions.status, 'active'),
            sql`${auctions.id} NOT IN (SELECT auction_id FROM bids WHERE professional_id = ${userId})`,
          )
        )
        .orderBy(desc(auctions.createdAt))
        .limit(10);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            Dashboard Professionista 💼
          </h1>
          <p className="text-[var(--muted)] mt-1">
            {pro?.businessName || session.user.name}
            {pro?.status === 'pending' && <span className="ml-2 badge bg-amber-100 text-amber-700">In attesa di approvazione</span>}
            {pro?.status === 'approved' && <span className="ml-2 badge bg-green-100 text-green-700">✓ Verificato</span>}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--primary)]">{myBids.length}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Offerte inviate</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--success)]">{acceptedBids.length}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Lavori vinti</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--accent)]">{winRate}%</div>
          <div className="text-sm text-[var(--muted)] mt-1">Win rate</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--foreground)]">{formatCurrency(totalEarnings)}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Guadagni totali</div>
        </div>
      </div>

      {/* Available auctions */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
          Aste disponibili ({availableAuctions.length})
        </h2>
        {availableAuctions.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {availableAuctions.map(a => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm text-[var(--muted)]">
              {pro?.status === 'pending'
                ? 'Il tuo profilo e in attesa di approvazione. Potrai biddare quando sarai verificato.'
                : 'Nessuna asta disponibile al momento. Torna piu tardi!'}
            </p>
          </div>
        )}
      </div>

      {/* Recent bids */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Le tue ultime offerte</h2>
        {myBids.length > 0 ? (
          <div className="space-y-2">
            {myBids.map(b => (
              <Link key={b.bid.id} href={`/aste/${b.bid.auctionId}`} className="card p-4 flex items-center justify-between block hover:border-[var(--primary)]/30">
                <div>
                  <div className="font-semibold text-sm text-[var(--foreground)]">{b.auctionTitle}</div>
                  <div className="text-xs text-[var(--muted)]">Budget: {formatCurrency(b.maxBudget)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--foreground)]">{formatCurrency(b.bid.amountCents)}</div>
                  <span className={`badge text-[10px] ${
                    b.bid.status === 'accepted' ? 'bg-green-100 text-green-700'
                      : b.bid.status === 'rejected' ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {b.bid.status === 'accepted' ? 'Vinta!' : b.bid.status === 'rejected' ? 'Non accettata' : 'In attesa'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm text-[var(--muted)]">Non hai ancora fatto offerte</p>
          </div>
        )}
      </div>
    </div>
  );
}
