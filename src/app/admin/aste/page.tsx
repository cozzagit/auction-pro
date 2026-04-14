import { db } from '@/lib/db';
import { auctions, users, bids } from '@/lib/db/schema';
import { eq, desc, sql, asc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/pricing';
import Link from 'next/link';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: 'Attiva', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Scaduta', cls: 'bg-red-100 text-red-700' },
  awarded: { label: 'Assegnata', cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In corso', cls: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completata', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annullata', cls: 'bg-gray-100 text-gray-600' },
};

export default async function AdminAuctionsPage() {
  const allAuctions = await db
    .select({
      id: auctions.id, title: auctions.title, maxBudget: auctions.maxBudget,
      city: auctions.city, province: auctions.province, status: auctions.status,
      createdAt: auctions.createdAt, expiresAt: auctions.expiresAt,
      creatorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      creatorEmail: users.email,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
      lowestBid: sql<number | null>`(SELECT min(amount_cents) FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions)
    .innerJoin(users, eq(auctions.userId, users.id))
    .orderBy(desc(auctions.createdAt))
    .limit(200);

  // Stats
  const byStatus: Record<string, number> = {};
  let totalBudget = 0;
  for (const a of allAuctions) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    totalBudget += a.maxBudget;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Gestione Aste ({allAuctions.length})</h1>
        <div className="text-sm text-[var(--muted)]">Volume budget: {formatCurrency(totalBudget)}</div>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(byStatus).map(([status, count]) => {
          const badge = STATUS_BADGE[status] || STATUS_BADGE.active;
          return (
            <div key={status} className={`badge px-3 py-1.5 text-sm ${badge.cls}`}>
              {badge.label}: <strong>{count}</strong>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--border-light)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Asta</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Cliente</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] hidden md:table-cell">Zona</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Budget</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-center">Offerte</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Migliore</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Stato</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] hidden lg:table-cell">Creata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {allAuctions.map(a => {
                const badge = STATUS_BADGE[a.status] || STATUS_BADGE.active;
                const savings = a.lowestBid ? Math.round(((a.maxBudget - a.lowestBid) / a.maxBudget) * 100) : null;
                return (
                  <tr key={a.id} className="hover:bg-[var(--border-light)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/aste/${a.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{a.creatorName}</div>
                      <div className="text-[10px] text-[var(--muted)]">{a.creatorEmail}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--muted)] text-xs">
                      {[a.city, a.province].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(a.maxBudget)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${a.bidCount > 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>{a.bidCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.lowestBid ? (
                        <div>
                          <span className="font-mono font-medium text-[var(--success)]">{formatCurrency(a.lowestBid)}</span>
                          {savings !== null && savings > 0 && (
                            <div className="text-[10px] text-[var(--success)]">-{savings}%</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--muted)]">
                      {new Date(a.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
