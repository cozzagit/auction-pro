import { db } from '@/lib/db';
import { payments, auctions, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/pricing';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'In attesa', cls: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pagato', cls: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Fallito', cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'Rimborsato', cls: 'bg-gray-100 text-gray-600' },
};

export default async function AdminPaymentsPage() {
  const allPayments = await db
    .select({
      payment: payments,
      auctionTitle: auctions.title,
      clientName: sql<string>`(SELECT first_name || ' ' || last_name FROM users WHERE id = ${payments.clientUserId})`,
      proName: sql<string>`(SELECT first_name || ' ' || last_name FROM users WHERE id = ${payments.professionalUserId})`,
    })
    .from(payments)
    .innerJoin(auctions, eq(payments.auctionId, auctions.id))
    .orderBy(desc(payments.createdAt))
    .limit(200);

  // Totals
  const paid = allPayments.filter(p => p.payment.status === 'paid');
  const pending = allPayments.filter(p => p.payment.status === 'pending');
  const totalRevenue = paid.reduce((s, p) => s + p.payment.platformFeeCents, 0);
  const totalVolume = paid.reduce((s, p) => s + p.payment.finalAmountCents, 0);
  const pendingRevenue = pending.reduce((s, p) => s + p.payment.platformFeeCents, 0);
  const avgSavings = paid.length > 0
    ? Math.round(paid.reduce((s, p) => s + ((p.payment.originalAmountCents - p.payment.finalAmountCents) / p.payment.originalAmountCents) * 100, 0) / paid.length)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Pagamenti ({allPayments.length})</h1>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Revenue (6%)</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-emerald-600">{paid.length} transazioni</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Volume Transato</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">{formatCurrency(totalVolume)}</div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Attesa</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{formatCurrency(pendingRevenue)}</div>
          <div className="text-xs text-amber-600">{pending.length} pagamenti</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Risparmio Clienti</div>
          <div className="text-2xl font-extrabold text-[var(--foreground)] mt-1">{avgSavings}%</div>
          <div className="text-xs text-[var(--muted)]">medio per transazione</div>
        </div>
      </div>

      {/* Payments table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--border-light)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Asta</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Cliente</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Professionista</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Budget</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Offerta</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Finale</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Fee 6%</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {allPayments.map(p => {
                const badge = STATUS_BADGE[p.payment.status] || STATUS_BADGE.pending;
                const savings = Math.round(((p.payment.originalAmountCents - p.payment.finalAmountCents) / p.payment.originalAmountCents) * 100);
                return (
                  <tr key={p.payment.id} className="hover:bg-[var(--border-light)]/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-xs">{p.auctionTitle}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.clientName}</td>
                    <td className="px-4 py-3 text-xs">{p.proName}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(p.payment.originalAmountCents)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(p.payment.winningBidAmountCents)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono text-xs font-bold">{formatCurrency(p.payment.finalAmountCents)}</div>
                      <div className="text-[10px] text-[var(--success)]">-{savings}%</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-600">
                      {formatCurrency(p.payment.platformFeeCents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${badge.cls}`}>{badge.label}</span>
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
