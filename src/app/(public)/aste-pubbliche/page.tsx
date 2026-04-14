import { db } from '@/lib/db';
import { auctions, users, categories, auctionServices, services } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import Link from 'next/link';

export default async function PublicAuctionsPage() {
  const activeAuctions = await db
    .select({
      id: auctions.id,
      title: auctions.title,
      description: auctions.description,
      maxBudget: auctions.maxBudget,
      city: auctions.city,
      province: auctions.province,
      status: auctions.status,
      expiresAt: auctions.expiresAt,
      createdAt: auctions.createdAt,
      creatorFirstName: users.firstName,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
      lowestBid: sql<number | null>`(SELECT min(amount_cents) FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions)
    .innerJoin(users, eq(auctions.userId, users.id))
    .where(eq(auctions.status, 'active'))
    .orderBy(desc(auctions.createdAt))
    .limit(50);

  const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);

  const totalActive = activeAuctions.length;
  const totalBids = activeAuctions.reduce((s, a) => s + a.bidCount, 0);
  const zones = new Set(activeAuctions.map(a => a.city).filter(Boolean));

  return (
    <div className="space-y-8">
      <div className="text-center pt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Aste Attive</h1>
        <p className="mt-2 text-[var(--muted)] text-lg">Trova il professionista perfetto per le tue esigenze</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[var(--primary)]">{totalActive}</div>
          <div className="text-xs text-[var(--muted)]">Aste attive</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[var(--accent)]">{totalBids}</div>
          <div className="text-xs text-[var(--muted)]">Offerte totali</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-extrabold text-[var(--success)]">{zones.size}</div>
          <div className="text-xs text-[var(--muted)]">Zone</div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {allCategories.slice(0, 12).map(cat => (
          <span key={cat.id} className="badge shrink-0 px-3 py-1.5 text-sm bg-[var(--border-light)] text-[var(--muted)] cursor-default">
            {cat.icon} {cat.name}
          </span>
        ))}
      </div>

      {/* Auctions grid */}
      {activeAuctions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAuctions.map(a => {
            const location = [a.city, a.province].filter(Boolean).join(', ');
            const savings = a.lowestBid ? Math.round(((a.maxBudget - a.lowestBid) / a.maxBudget) * 100) : null;

            return (
              <div key={a.id} className="card overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
                <div className="p-5">
                  <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-2 line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] line-clamp-2 mb-3">{a.description}</p>

                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] mb-3">
                    {location && <span>📍 {location}</span>}
                    <span>👤 {a.creatorFirstName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[var(--muted)]">Budget max</div>
                      <div className="font-bold text-lg text-[var(--foreground)]">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(a.maxBudget / 100)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[var(--muted)]">{a.bidCount} offerte</div>
                      {a.lowestBid && (
                        <div className="font-bold text-[var(--success)]">
                          {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(a.lowestBid / 100)}
                        </div>
                      )}
                    </div>
                  </div>

                  {savings !== null && savings > 0 && (
                    <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold text-center">
                      💰 Risparmio attuale: -{savings}%
                    </div>
                  )}
                </div>

                {/* Timer strip */}
                <div className="h-[3px] bg-gradient-to-r from-amber-400 to-amber-300" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Nessuna asta attiva al momento</h3>
          <p className="text-[var(--muted)] mb-6">Sii il primo a pubblicare un&apos;asta e ricevere offerte dai professionisti!</p>
          <Link href="/registrati" className="btn btn-primary px-8 py-3">Crea la tua prima asta</Link>
        </div>
      )}

      {/* CTA */}
      <div className="card p-8 text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <h3 className="text-xl font-extrabold text-[var(--foreground)] mb-2">Vuoi partecipare?</h3>
        <p className="text-[var(--muted)] mb-4">Registrati gratis per pubblicare aste o fare offerte come professionista</p>
        <div className="flex gap-3 justify-center">
          <Link href="/registrati" className="btn btn-primary">Registrati come cliente</Link>
          <Link href="/registrati/professionista" className="btn btn-outline">Sei un professionista?</Link>
        </div>
      </div>
    </div>
  );
}
