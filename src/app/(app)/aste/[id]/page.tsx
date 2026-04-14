import { db } from '@/lib/db';
import { auctions, bids, users, professionals, auctionServices, services, categories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils/pricing';
import { CountdownTimer } from '@/components/auction/countdown-timer';
import { BidPanel } from '@/components/auction/bid-panel';
import Link from 'next/link';

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [auction] = await db.select().from(auctions).where(eq(auctions.id, id));
  if (!auction) notFound();

  const [creator] = await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, auction.userId));

  const auctionBids = await db
    .select({
      bid: bids,
      proName: users.firstName,
      proLastName: users.lastName,
      businessName: professionals.businessName,
      rating: professionals.rating,
      totalJobs: professionals.totalJobs,
      hasInsurance: professionals.hasInsurance,
      hasLicense: professionals.hasLicense,
      proStatus: professionals.status,
    })
    .from(bids)
    .innerJoin(users, eq(bids.professionalId, users.id))
    .leftJoin(professionals, eq(professionals.userId, users.id))
    .where(eq(bids.auctionId, id))
    .orderBy(asc(bids.amountCents));

  const auctionSvcs = await db
    .select({ as: auctionServices, serviceName: services.name, categoryName: categories.name })
    .from(auctionServices)
    .innerJoin(services, eq(auctionServices.serviceId, services.id))
    .innerJoin(categories, eq(services.categoryId, categories.id))
    .where(eq(auctionServices.auctionId, id));

  const isOwner = session?.user?.id === auction.userId;
  const isPro = session?.user?.role === 'professional';
  const alreadyBid = auctionBids.some(b => b.bid.professionalId === session?.user?.id);

  const location = [auction.city, auction.province].filter(Boolean).join(', ');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← Torna indietro
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">{auction.title}</h1>
          <span className={`badge shrink-0 text-sm ${
            auction.status === 'active' ? 'bg-blue-100 text-blue-700'
              : auction.status === 'completed' ? 'bg-green-100 text-green-700'
              : auction.status === 'awarded' ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {auction.status === 'active' ? 'Attiva' : auction.status === 'completed' ? 'Completata' : auction.status === 'awarded' ? 'Assegnata' : auction.status}
          </span>
        </div>

        <p className="text-[var(--muted)] leading-relaxed mb-4">{auction.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted)]">Budget:</span>
            <span className="font-bold text-[var(--foreground)] text-lg">{formatCurrency(auction.maxBudget)}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <span className="text-[var(--foreground)]">{location}</span>
            </div>
          )}
          {creator && (
            <div className="flex items-center gap-1.5">
              <span>👤</span>
              <span className="text-[var(--muted)]">{creator.firstName} {creator.lastName}</span>
            </div>
          )}
          {auction.status === 'active' && auction.expiresAt && (
            <CountdownTimer expiresAt={auction.expiresAt} />
          )}
        </div>
      </div>

      {/* Services */}
      {auctionSvcs.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Servizi richiesti</h2>
          <div className="space-y-3">
            {auctionSvcs.map((s) => (
              <div key={s.as.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--border-light)]">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg shrink-0">
                  🔧
                </div>
                <div>
                  <div className="font-semibold text-[var(--foreground)]">{s.serviceName}</div>
                  <div className="text-xs text-[var(--muted)]">{s.categoryName}</div>
                  {s.as.parameters && Object.keys(s.as.parameters as Record<string, unknown>).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(s.as.parameters as Record<string, unknown>).map(([key, val]) => (
                        <span key={key} className="badge bg-white text-[var(--muted)] border border-[var(--border)] text-[11px]">
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        {/* Bids list */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
            Offerte ({auctionBids.length})
          </h2>
          {auctionBids.length > 0 ? (
            <div className="space-y-3">
              {auctionBids.map((b, i) => (
                <div key={b.bid.id} className={`p-4 rounded-xl border ${
                  i === 0 ? 'border-[var(--success)] bg-green-50' : 'border-[var(--border)]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                        {(b.proName || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--foreground)]">
                          {b.businessName || `${b.proName} ${b.proLastName}`}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                          {b.rating && b.rating > 0 && <span>⭐ {b.rating.toFixed(1)}</span>}
                          {b.totalJobs && b.totalJobs > 0 && <span>{b.totalJobs} lavori</span>}
                          {b.proStatus === 'approved' && <span className="text-[var(--success)]">✓ Verificato</span>}
                          {b.hasInsurance && <span>🛡️</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-extrabold ${i === 0 ? 'text-[var(--success)]' : 'text-[var(--foreground)]'}`}>
                        {formatCurrency(b.bid.amountCents)}
                      </div>
                      {i === 0 && <div className="text-[10px] font-bold text-[var(--success)] uppercase">Migliore</div>}
                    </div>
                  </div>
                  {b.bid.message && (
                    <p className="text-sm text-[var(--muted)] mt-2 pl-10">{b.bid.message}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🤷</div>
              <p className="text-sm text-[var(--muted)]">Nessuna offerta ancora. Sii il primo!</p>
            </div>
          )}
        </div>

        {/* Bid panel (sticky) */}
        <div className="md:sticky md:top-20 md:self-start">
          {auction.status === 'active' && isPro && !isOwner && !alreadyBid && (
            <BidPanel auctionId={auction.id} maxBudget={auction.maxBudget} />
          )}
          {alreadyBid && (
            <div className="card p-5 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="font-semibold text-[var(--foreground)]">Offerta inviata</p>
              <p className="text-sm text-[var(--muted)] mt-1">Hai gia fatto un&apos;offerta su questa asta</p>
            </div>
          )}
          {isOwner && auctionBids.length > 0 && auction.status === 'active' && (
            <div className="card p-5 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <p className="font-semibold text-[var(--foreground)] mb-3">Accetta un&apos;offerta</p>
              <p className="text-sm text-[var(--muted)] mb-4">L&apos;offerta migliore e {formatCurrency(auctionBids[0].bid.amountCents)}</p>
              <form action={`/api/auctions/${auction.id}/accept`} method="POST">
                <input type="hidden" name="bidId" value={auctionBids[0].bid.id} />
                <button className="btn btn-primary w-full">Accetta migliore offerta</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
