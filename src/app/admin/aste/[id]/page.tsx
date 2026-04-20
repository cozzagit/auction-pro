import { db } from '@/lib/db';
import { auctions, bids, users, professionals, payments, contracts, reviews, auctionServices, services, categories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/pricing';
import { CountdownTimer } from '@/components/auction/countdown-timer';
import { PhotoGallery } from '@/components/auction/photo-gallery';
import Link from 'next/link';
import { AuctionAdminActions } from './actions';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Attiva', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Scaduta', cls: 'bg-red-100 text-red-700' },
  awarded: { label: 'Assegnata', cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In corso', cls: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completata', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annullata', cls: 'bg-gray-100 text-gray-600' },
};

export default async function AdminAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
  if (!auction) notFound();

  const [creator] = await db.select().from(users).where(eq(users.id, auction.userId));

  const auctionBids = await db
    .select({
      bid: bids,
      proName: users.firstName, proLastName: users.lastName, proEmail: users.email,
      businessName: professionals.businessName,
      rating: professionals.rating, totalJobs: professionals.totalJobs,
      hasInsurance: professionals.hasInsurance, hasLicense: professionals.hasLicense,
      proStatus: professionals.status,
    })
    .from(bids)
    .innerJoin(users, eq(bids.professionalId, users.id))
    .leftJoin(professionals, eq(professionals.userId, users.id))
    .where(eq(bids.auctionId, id))
    .orderBy(asc(bids.amountCents));

  const auctionSvcs = await db
    .select({ as: auctionServices, serviceName: services.name, categoryName: categories.name, catIcon: categories.icon, catColor: categories.color })
    .from(auctionServices)
    .innerJoin(services, eq(auctionServices.serviceId, services.id))
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(eq(auctionServices.auctionId, id));

  const [payment] = await db.select().from(payments).where(eq(payments.auctionId, id));
  const [contract] = await db.select().from(contracts).where(eq(contracts.auctionId, id));
  const auctionReviews = await db.select().from(reviews).where(eq(reviews.auctionId, id));

  const badge = STATUS_MAP[auction.status] || STATUS_MAP.active;
  const location = [auction.city, auction.province].filter(Boolean).join(', ');
  const bestBid = auctionBids[0]?.bid;
  const estFinal = bestBid ? Math.round((auction.maxBudget + bestBid.amountCents) / 2) : null;
  const estFee = estFinal ? Math.round(estFinal * 0.06) : null;
  const savings = bestBid ? Math.round(((auction.maxBudget - bestBid.amountCents) / auction.maxBudget) * 100) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/aste" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Torna alle aste
      </Link>

      {/* ═══ HEADER ═══ */}
      <div className="card overflow-hidden">
        {auction.status === 'active' && <div className="timer-strip" />}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)]">{auction.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`badge text-sm px-3 py-1 ${badge.cls}`}>{badge.label}</span>
                {auctionSvcs.map((s, i) => (
                  <span key={i} className="badge text-xs px-2 py-1" style={{ background: `${s.catColor}15`, color: s.catColor }}>
                    {s.catIcon} {s.categoryName}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-[var(--muted)] uppercase tracking-wider font-medium">Budget massimo</div>
              <div className="text-3xl font-extrabold text-[var(--foreground)]">{formatCurrency(auction.maxBudget)}</div>
            </div>
          </div>

          <p className="text-[var(--muted)] leading-relaxed mb-6">{auction.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoBox label="Cliente" main={`${creator?.firstName} ${creator?.lastName}`} sub={creator?.email} />
            <InfoBox label="Zona" main={location ? `📍 ${location}` : 'Non specificata'} />
            <div className="p-3 rounded-xl bg-[var(--border-light)]">
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">Scadenza</div>
              <div className="font-semibold text-sm mt-0.5">
                {auction.expiresAt ? new Date(auction.expiresAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nessuna'}
              </div>
              {auction.status === 'active' && auction.expiresAt && (
                <div className="mt-1"><CountdownTimer expiresAt={auction.expiresAt} compact /></div>
              )}
            </div>
            <InfoBox
              label="Date"
              main={`Creata: ${new Date(auction.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`}
              sub={auction.closedAt ? `Chiusa: ${new Date(auction.closedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}` : undefined}
            />
          </div>
        </div>
      </div>

      {/* ═══ ADMIN ACTIONS ═══ */}
      <AuctionAdminActions auctionId={auction.id} status={auction.status} />

      {/* Photos + Documents */}
      {(auction.photos && (auction.photos as string[]).length > 0) && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-3">📷 Foto ({(auction.photos as string[]).length})</h2>
          <PhotoGallery photos={auction.photos as string[]} />
        </div>
      )}
      {(auction.documents && (auction.documents as Array<{name:string;url:string;size:number}>).length > 0) && (
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-3">📄 Documenti</h2>
          <div className="space-y-2">
            {(auction.documents as Array<{name:string;url:string;size:number}>).map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-[var(--border-light)] hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <div className="text-sm font-medium">{doc.name}</div>
                    <div className="text-xs text-[var(--muted)]">{(doc.size / 1024).toFixed(0)}KB</div>
                  </div>
                </div>
                <span className="text-xs text-[var(--primary)] font-medium">⬇</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PRICING ═══ */}
      {bestBid && (
        <div className="card p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <h2 className="font-bold text-sm text-emerald-800 uppercase tracking-wider mb-4">
            {payment ? '💰 Pagamento' : '📊 Stima Prezzo'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <PriceBox label="Budget" value={formatCurrency(auction.maxBudget)} color="text-blue-700" />
            <div className="text-center">
              <div className="text-[10px] text-[var(--muted)] uppercase">Migliore offerta</div>
              <div className="text-xl font-extrabold text-amber-700">{formatCurrency(bestBid.amountCents)}</div>
              {savings !== null && <div className="text-xs text-emerald-600 font-semibold">-{savings}%</div>}
            </div>
            <PriceBox label="Prezzo finale" value={formatCurrency(payment?.finalAmountCents || estFinal || 0)} color="text-emerald-700" sub="(budget + offerta) / 2" />
            <div className="text-center">
              <div className="text-[10px] text-[var(--muted)] uppercase">Revenue 6%</div>
              <div className={`text-xl font-extrabold ${payment ? 'text-emerald-700' : 'text-gray-400'}`}>
                {formatCurrency(payment?.platformFeeCents || estFee || 0)}
              </div>
              <div className="text-[10px] text-[var(--muted)]">{payment ? 'confermata' : 'stimata'}</div>
            </div>
            <PriceBox label="Pro riceve" value={formatCurrency((payment?.finalAmountCents || estFinal || 0) - (payment?.platformFeeCents || estFee || 0))} color="text-purple-700" />
          </div>
          {payment && (
            <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center gap-3">
              <span className={`badge ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : payment.status === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                {payment.status === 'paid' ? '✅ Pagato' : payment.status === 'refunded' ? '↩️ Rimborsato' : '⏳ In attesa'}
              </span>
              {payment.paidAt && <span className="text-xs text-[var(--muted)]">il {new Date(payment.paidAt).toLocaleDateString('it-IT')}</span>}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* ═══ BIDS ═══ */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Offerte ({auctionBids.length})</h2>
          {auctionBids.length > 0 ? (
            <div className="space-y-3">
              {auctionBids.map((b, i) => (
                <div key={b.bid.id} className={`p-4 rounded-xl border transition-all ${
                  b.bid.status === 'accepted' ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
                    : b.bid.status === 'rejected' ? 'border-red-100 bg-red-50/30 opacity-50'
                    : i === 0 ? 'border-emerald-200 bg-green-50/50'
                    : 'border-[var(--border)]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                        {(b.proName || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{b.businessName || `${b.proName} ${b.proLastName}`}</div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
                          {b.rating && b.rating > 0 && <span>⭐ {b.rating.toFixed(1)}</span>}
                          {b.totalJobs && b.totalJobs > 0 && <span>{b.totalJobs} lavori</span>}
                          {b.proStatus === 'approved' && <span className="text-emerald-600">✓ Verificato</span>}
                          {b.hasInsurance && <span>🛡️</span>}
                          {b.hasLicense && <span>📜</span>}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] mt-0.5">{b.proEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-extrabold ${b.bid.status === 'accepted' || (b.bid.status === 'pending' && i === 0) ? 'text-emerald-600' : ''}`}>
                        {formatCurrency(b.bid.amountCents)}
                      </div>
                      {b.bid.status === 'accepted' && <div className="text-[10px] font-bold text-emerald-600">🏆 Vincitore</div>}
                      {b.bid.status === 'rejected' && <div className="text-[10px] text-red-500">Rifiutata</div>}
                      {b.bid.status === 'pending' && i === 0 && <div className="text-[10px] font-bold text-emerald-600">Migliore</div>}
                    </div>
                  </div>
                  {b.bid.message && (
                    <p className="text-sm text-[var(--muted)] mt-3 pl-3 italic border-l-2 border-[var(--border)] ml-13">&quot;{b.bid.message}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-[var(--muted)]">Nessuna offerta ricevuta</p>
            </div>
          )}
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="space-y-4">
          {auctionSvcs.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-3">Servizi richiesti</h3>
              {auctionSvcs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--border-light)] mb-2 last:mb-0">
                  <span className="text-lg">{s.catIcon}</span>
                  <div>
                    <div className="text-sm font-semibold">{s.serviceName}</div>
                    <div className="text-[10px] text-[var(--muted)]">{s.categoryName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {contract && (
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-3">📋 Contratto</h3>
              <span className={`badge mb-3 ${contract.contractStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : contract.contractStatus === 'disputed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {contract.contractStatus === 'completed' ? 'Completato' : contract.contractStatus === 'disputed' ? 'In disputa' : 'Attivo'}
              </span>
              {contract.clientContactInfo && (
                <div className="p-3 rounded-lg bg-blue-50 mb-2 text-xs">
                  <div className="font-bold text-blue-700 text-[10px] uppercase mb-1">Cliente</div>
                  <div>{(contract.clientContactInfo as {name:string}).name}</div>
                  <div className="text-[var(--muted)]">{(contract.clientContactInfo as {email:string}).email}</div>
                  <div className="text-[var(--muted)]">{(contract.clientContactInfo as {phone:string}).phone || '-'}</div>
                </div>
              )}
              {contract.professionalContactInfo && (
                <div className="p-3 rounded-lg bg-emerald-50 text-xs">
                  <div className="font-bold text-emerald-700 text-[10px] uppercase mb-1">Professionista</div>
                  <div>{(contract.professionalContactInfo as {businessName:string}).businessName}</div>
                  <div className="text-[var(--muted)]">{(contract.professionalContactInfo as {email:string}).email}</div>
                  <div className="text-[var(--muted)]">{(contract.professionalContactInfo as {phone:string}).phone || '-'}</div>
                </div>
              )}
            </div>
          )}

          {auctionReviews.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-sm mb-3">⭐ Recensione</h3>
              {auctionReviews.map(r => (
                <div key={r.id}>
                  <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-base ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                    <span className="text-sm font-bold ml-1">{r.rating}/5</span>
                  </div>
                  {r.comment && <p className="text-xs text-[var(--muted)] italic">&quot;{r.comment}&quot;</p>}
                </div>
              ))}
            </div>
          )}

          <div className="card p-4 text-[10px] text-[var(--muted)] space-y-0.5 font-mono">
            <div>ID: {auction.id.slice(0, 8)}...</div>
            <div>Creata: {new Date(auction.createdAt).toLocaleString('it-IT')}</div>
            {auction.expiresAt && <div>Scadenza: {new Date(auction.expiresAt).toLocaleString('it-IT')}</div>}
            {auction.closedAt && <div>Chiusa: {new Date(auction.closedAt).toLocaleString('it-IT')}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, main, sub }: { label: string; main: string; sub?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--border-light)]">
      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium">{label}</div>
      <div className="font-semibold text-sm mt-0.5">{main}</div>
      {sub && <div className="text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

function PriceBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-[var(--muted)] uppercase">{label}</div>
      <div className={`text-xl font-extrabold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-emerald-600">{sub}</div>}
    </div>
  );
}
