import { db } from '@/lib/db';
import { auctions, bids, users, professionals, auctionServices, services, categories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/pricing';
import { CountdownTimer } from '@/components/auction/countdown-timer';
import { PhotoGallery } from '@/components/auction/photo-gallery';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Attiva', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Scaduta', cls: 'bg-red-100 text-red-700' },
  awarded: { label: 'Assegnata', cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In corso', cls: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completata', cls: 'bg-emerald-100 text-emerald-700' },
};

export default async function PublicAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
  if (!auction) notFound();

  const [creator] = await db.select({ firstName: users.firstName }).from(users).where(eq(users.id, auction.userId));

  const auctionBids = await db
    .select({
      bid: bids,
      proName: users.firstName, proLastName: users.lastName,
      businessName: professionals.businessName,
      rating: professionals.rating, totalJobs: professionals.totalJobs,
      hasInsurance: professionals.hasInsurance, proStatus: professionals.status,
    })
    .from(bids)
    .innerJoin(users, eq(bids.professionalId, users.id))
    .leftJoin(professionals, eq(professionals.userId, users.id))
    .where(eq(bids.auctionId, id))
    .orderBy(asc(bids.amountCents));

  const auctionSvcs = await db
    .select({ serviceName: services.name, categoryName: categories.name, catIcon: categories.icon, catColor: categories.color })
    .from(auctionServices)
    .innerJoin(services, eq(auctionServices.serviceId, services.id))
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(eq(auctionServices.auctionId, id));

  const badge = STATUS_MAP[auction.status] || STATUS_MAP.active;
  const location = [auction.city, auction.province].filter(Boolean).join(', ');
  const photos = (auction.photos as string[]) || [];
  const docs = (auction.documents as Array<{name:string;url:string;size:number}>) || [];
  const bestBid = auctionBids[0]?.bid;
  const savings = bestBid ? Math.round(((auction.maxBudget - bestBid.amountCents) / auction.maxBudget) * 100) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/aste-pubbliche" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Torna alle aste
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        {auction.status === 'active' && <div className="timer-strip" />}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
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
              <div className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)]">{formatCurrency(auction.maxBudget)}</div>
            </div>
          </div>

          <p className="text-[var(--muted)] leading-relaxed mb-6">{auction.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {location && <span>📍 {location}</span>}
            {creator && <span>👤 {creator.firstName}</span>}
            {auction.status === 'active' && auction.expiresAt && (
              <CountdownTimer expiresAt={auction.expiresAt} />
            )}
          </div>
        </div>
      </div>

      {/* CTA registrazione */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-center">
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">Interessato a questa asta?</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          {auction.status === 'active'
            ? 'Registrati gratis per fare la tua offerta o pubblicare una richiesta simile'
            : 'Registrati gratis per pubblicare aste simili e risparmiare sui tuoi lavori'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/registrati" className="btn btn-primary">Registrati come cliente</Link>
          <Link href="/registrati/professionista" className="btn btn-outline">Sono un professionista</Link>
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">📷 Foto ({photos.length})</h2>
          <PhotoGallery photos={photos} />
        </div>
      )}

      {/* Documents */}
      {docs.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">📄 Documenti allegati</h2>
          <div className="space-y-2">
            {docs.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--border-light)] opacity-75">
                <span className="text-xl">📄</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.name}</div>
                  <div className="text-xs text-[var(--muted)]">Accessibile dopo registrazione</div>
                </div>
                <Link href="/registrati" className="text-xs text-[var(--primary)] font-medium">Sblocca →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {auctionSvcs.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Servizi richiesti</h2>
          <div className="flex flex-wrap gap-2">
            {auctionSvcs.map((s, i) => (
              <span key={i} className="badge text-sm px-3 py-1.5 bg-[var(--border-light)]">
                {s.catIcon} {s.serviceName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pricing preview */}
      {bestBid && auction.status === 'active' && (
        <div className="card p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <h2 className="font-bold text-sm text-emerald-800 uppercase tracking-wider mb-4">📊 Situazione attuale</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10px] text-[var(--muted)] uppercase">Budget</div>
              <div className="text-xl font-extrabold text-blue-700">{formatCurrency(auction.maxBudget)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--muted)] uppercase">Migliore offerta</div>
              <div className="text-xl font-extrabold text-amber-700">{formatCurrency(bestBid.amountCents)}</div>
              {savings !== null && <div className="text-xs text-emerald-600 font-semibold">-{savings}%</div>}
            </div>
            <div>
              <div className="text-[10px] text-[var(--muted)] uppercase">Prezzo finale stimato</div>
              <div className="text-xl font-extrabold text-emerald-700">{formatCurrency(Math.round((auction.maxBudget + bestBid.amountCents) / 2))}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bids anonymized */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Offerte ({auctionBids.length})</h2>
          {auctionBids.length > 0 && <span className="text-xs text-[var(--muted)]">Dettagli completi dopo registrazione</span>}
        </div>
        {auctionBids.length > 0 ? (
          <div className="space-y-3">
            {auctionBids.slice(0, 5).map((b, i) => (
              <div key={b.bid.id} className={`p-4 rounded-xl border ${i === 0 ? 'border-emerald-200 bg-green-50' : 'border-[var(--border)]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                      {(b.proName || '?').charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {b.businessName ? `${b.businessName.charAt(0)}*** ${b.businessName.split(' ').slice(1).join(' ')}` : `${b.proName?.charAt(0)}. ${b.proLastName?.charAt(0)}.`}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                        {b.rating && b.rating > 0 && <span>⭐ {b.rating.toFixed(1)}</span>}
                        {b.totalJobs && b.totalJobs > 0 && <span>{b.totalJobs} lavori</span>}
                        {b.proStatus === 'approved' && <span className="text-emerald-600">✓ Verificato</span>}
                        {b.hasInsurance && <span>🛡️</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-extrabold ${i === 0 ? 'text-emerald-600' : ''}`}>{formatCurrency(b.bid.amountCents)}</div>
                    {i === 0 && <div className="text-[10px] font-bold text-emerald-600">Migliore</div>}
                  </div>
                </div>
              </div>
            ))}
            {auctionBids.length > 5 && (
              <div className="text-center p-3 text-sm text-[var(--muted)]">
                +{auctionBids.length - 5} altre offerte — <Link href="/registrati" className="text-[var(--primary)] font-medium hover:underline">registrati per vederle tutte</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-[var(--muted)]">Nessuna offerta ancora. Registrati come professionista per essere il primo!</p>
          </div>
        )}
      </div>

      {/* Final CTA */}
      <div className="card p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
        <h3 className="text-xl font-extrabold mb-2">Vuoi partecipare a questa asta?</h3>
        <p className="text-sm text-blue-100 mb-4">Registrati gratis in 2 minuti e inizia subito</p>
        <Link href="/registrati" className="btn bg-white text-blue-700 font-bold px-6 py-3 text-base hover:bg-blue-50 shadow-lg rounded-xl hover-lift">
          Inizia gratis →
        </Link>
      </div>
    </div>
  );
}
