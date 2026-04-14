import { db } from '@/lib/db';
import { auctions, bids, users, professionals, payments, contracts, auctionServices, services, categories } from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/pricing';
import Link from 'next/link';
import { AuctionAdminActions } from './actions';

export default async function AdminAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
  if (!auction) notFound();

  const [creator] = await db.select().from(users).where(eq(users.id, auction.userId));

  const auctionBids = await db
    .select({
      bid: bids,
      proName: users.firstName, proLastName: users.lastName,
      businessName: professionals.businessName,
      rating: professionals.rating,
    })
    .from(bids)
    .innerJoin(users, eq(bids.professionalId, users.id))
    .leftJoin(professionals, eq(professionals.userId, users.id))
    .where(eq(bids.auctionId, id))
    .orderBy(asc(bids.amountCents));

  const auctionSvcs = await db
    .select({ serviceName: services.name, categoryName: categories.name })
    .from(auctionServices)
    .innerJoin(services, eq(auctionServices.serviceId, services.id))
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(eq(auctionServices.auctionId, id));

  const [payment] = await db.select().from(payments).where(eq(payments.auctionId, id));
  const [contract] = await db.select().from(contracts).where(eq(contracts.auctionId, id));

  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    active: { label: 'Attiva', cls: 'bg-blue-100 text-blue-700' },
    expired: { label: 'Scaduta', cls: 'bg-red-100 text-red-700' },
    awarded: { label: 'Assegnata', cls: 'bg-amber-100 text-amber-700' },
    in_progress: { label: 'In corso', cls: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Completata', cls: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annullata', cls: 'bg-gray-100 text-gray-600' },
  };
  const badge = STATUS_BADGE[auction.status] || STATUS_BADGE.active;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/aste" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Torna alle aste</Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-extrabold">{auction.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">{auction.description}</p>
          </div>
          <span className={`badge text-sm px-3 py-1.5 shrink-0 ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-[var(--muted)]">Budget:</span> <strong>{formatCurrency(auction.maxBudget)}</strong></div>
          <div><span className="text-[var(--muted)]">Zona:</span> <strong>{[auction.city, auction.province].filter(Boolean).join(', ') || '-'}</strong></div>
          <div><span className="text-[var(--muted)]">Cliente:</span> <strong>{creator?.firstName} {creator?.lastName}</strong></div>
          <div><span className="text-[var(--muted)]">Creata:</span> <strong>{new Date(auction.createdAt).toLocaleDateString('it-IT')}</strong></div>
        </div>
        {auctionSvcs.length > 0 && (
          <div className="flex gap-2 mt-3">
            {auctionSvcs.map((s, i) => (
              <span key={i} className="badge bg-blue-50 text-blue-700 text-xs">{s.categoryName} — {s.serviceName}</span>
            ))}
          </div>
        )}
      </div>

      {/* Admin Actions */}
      <AuctionAdminActions auctionId={auction.id} status={auction.status} />

      {/* Bids */}
      <div className="card p-6">
        <h2 className="font-bold mb-4">Offerte ({auctionBids.length})</h2>
        {auctionBids.length > 0 ? (
          <div className="space-y-3">
            {auctionBids.map((b, i) => (
              <div key={b.bid.id} className={`p-4 rounded-xl border ${b.bid.status === 'accepted' ? 'border-emerald-300 bg-emerald-50' : b.bid.status === 'rejected' ? 'border-red-200 bg-red-50/30 opacity-60' : 'border-[var(--border)]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{b.businessName || `${b.proName} ${b.proLastName}`}</div>
                    <div className="text-xs text-[var(--muted)]">⭐ {b.rating?.toFixed(1) || '-'} · {b.bid.status === 'accepted' ? '✅ Accettata' : b.bid.status === 'rejected' ? '❌ Rifiutata' : '⏳ In attesa'}</div>
                    {b.bid.message && <div className="text-xs text-[var(--muted)] mt-1 italic">&quot;{b.bid.message}&quot;</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-extrabold ${i === 0 ? 'text-emerald-600' : ''}`}>{formatCurrency(b.bid.amountCents)}</div>
                    {i === 0 && <div className="text-[10px] text-emerald-600 font-bold">MIGLIORE</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted)] text-sm">Nessuna offerta</p>
        )}
      </div>

      {/* Payment */}
      {payment && (
        <div className="card p-6">
          <h2 className="font-bold mb-4">Pagamento</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-[var(--muted)]">Budget orig.:</span> <strong>{formatCurrency(payment.originalAmountCents)}</strong></div>
            <div><span className="text-[var(--muted)]">Offerta:</span> <strong>{formatCurrency(payment.winningBidAmountCents)}</strong></div>
            <div><span className="text-[var(--muted)]">Finale:</span> <strong className="text-[var(--primary)]">{formatCurrency(payment.finalAmountCents)}</strong></div>
            <div><span className="text-[var(--muted)]">Fee 6%:</span> <strong className="text-emerald-600">{formatCurrency(payment.platformFeeCents)}</strong></div>
          </div>
          <div className="mt-3">
            <span className={`badge ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : payment.status === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
              {payment.status === 'paid' ? 'Pagato' : payment.status === 'refunded' ? 'Rimborsato' : 'In attesa'}
            </span>
          </div>
        </div>
      )}

      {/* Contract */}
      {contract && (
        <div className="card p-6">
          <h2 className="font-bold mb-4">Contratto</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-blue-50">
              <div className="font-semibold text-blue-700 text-xs uppercase mb-1">Cliente</div>
              {contract.clientContactInfo && (
                <div className="text-xs text-[var(--muted)]">
                  <div>{(contract.clientContactInfo as {name:string}).name}</div>
                  <div>{(contract.clientContactInfo as {email:string}).email}</div>
                  <div>{(contract.clientContactInfo as {phone:string}).phone}</div>
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-emerald-50">
              <div className="font-semibold text-emerald-700 text-xs uppercase mb-1">Professionista</div>
              {contract.professionalContactInfo && (
                <div className="text-xs text-[var(--muted)]">
                  <div>{(contract.professionalContactInfo as {businessName:string}).businessName}</div>
                  <div>{(contract.professionalContactInfo as {email:string}).email}</div>
                  <div>{(contract.professionalContactInfo as {phone:string}).phone}</div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <span className={`badge ${contract.contractStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              {contract.contractStatus === 'completed' ? 'Completato' : contract.contractStatus === 'disputed' ? 'In disputa' : 'Attivo'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
