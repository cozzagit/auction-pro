import Link from 'next/link';
import { db } from '@/lib/db';
import { categories, auctions, users, bids, payments, reviews } from '@/lib/db/schema';
import { eq, desc, sql, asc } from 'drizzle-orm';

const STEPS = [
  { num: '1', title: 'Pubblica la tua richiesta', desc: 'Descrivi il servizio che ti serve e indica il tuo budget massimo. Gratis, in 2 minuti.', icon: '📝', color: '#3B82F6' },
  { num: '2', title: 'Ricevi offerte al ribasso', desc: 'I professionisti verificati competono per offrirti il prezzo piu basso. Tu risparmi senza fare nulla.', icon: '📩', color: '#F59E0B' },
  { num: '3', title: 'Scegli e risparmia', desc: 'Accetta l\'offerta migliore. Il prezzo finale e la media tra il tuo budget e l\'offerta — sempre meno del previsto.', icon: '🎉', color: '#10B981' },
];

const COMPARISON = [
  { feature: 'Costo per il cliente', ribasta: 'Gratis sempre', pp: 'Paga per ogni contatto', winner: 'r' },
  { feature: 'Trasparenza del prezzo', ribasta: 'Prezzo pubblico al ribasso', pp: 'Trattativa privata e opaca', winner: 'r' },
  { feature: 'Costo per il professionista', ribasta: 'Solo 6% a successo', pp: 'Crediti prepagati (persi se non converti)', winner: 'r' },
  { feature: 'Rischio per il pro', ribasta: 'Zero — paghi solo quando vinci', pp: 'Crediti bruciati per contatti senza risposta', winner: 'r' },
  { feature: 'Risparmio medio', ribasta: 'Fino al 40% sotto budget', pp: 'Nessun ribasso garantito', winner: 'r' },
  { feature: 'Contatti verificati', ribasta: 'Solo dopo accettazione offerta', pp: 'Disponibili anche senza interesse', winner: 'p' },
];

const TRUST_BADGES = [
  { icon: '🛡️', title: 'Pro verificati', desc: 'Documenti, P.IVA e referenze controllate' },
  { icon: '📜', title: 'Assicurazione RC', desc: 'I professionisti garantiti hanno copertura' },
  { icon: '💳', title: 'Pagamento protetto', desc: 'Importi trattenuti fino al completamento' },
  { icon: '⭐', title: 'Recensioni reali', desc: 'Solo da clienti che hanno pagato' },
];

const CLIENT_BENEFITS = [
  { icon: '💰', title: 'Risparmia fino al 40%', desc: 'I professionisti competono per te.' },
  { icon: '✅', title: 'Pro verificati', desc: 'Documenti, assicurazioni e referenze.' },
  { icon: '⚡', title: 'Offerte in poche ore', desc: 'Ricevi offerte competitive entro 24h.' },
  { icon: '🔒', title: 'Gratis per sempre', desc: 'Nessun costo di iscrizione o contatto.' },
];

const PRO_BENEFITS = [
  { icon: '📈', title: 'Guadagni di piu', desc: 'Il prezzo medio ti fa ottenere sempre piu della tua offerta.' },
  { icon: '👥', title: 'Clienti ogni giorno', desc: 'Accedi a richieste nella tua zona gratis.' },
  { icon: '💎', title: 'Solo 6% a successo', desc: 'Paghi solo quando vinci un lavoro.' },
  { icon: '⭐', title: 'Costruisci reputazione', desc: 'Rating e badge aumentano la tua visibilita.' },
];

export default async function LandingPage() {
  const topCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder)).limit(8);
  const recentAuctions = await db
    .select({
      id: auctions.id, title: auctions.title, maxBudget: auctions.maxBudget,
      city: auctions.city, status: auctions.status,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions)
    .where(eq(auctions.status, 'active'))
    .orderBy(desc(auctions.createdAt))
    .limit(3);

  // Platform stats
  const [stats] = await db.select({
    totalAuctions: sql<number>`(SELECT count(*)::int FROM auctions)`,
    completedAuctions: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'completed')`,
    totalSavings: sql<number>`COALESCE((SELECT sum(original_amount_cents - final_amount_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    avgRating: sql<number>`COALESCE((SELECT round(avg(rating)::numeric, 1) FROM reviews), 0)`,
    totalPros: sql<number>`(SELECT count(*)::int FROM professionals WHERE status = 'approved')`,
  }).from(sql`(SELECT 1) AS dummy`);

  // Recent activity feed (anonymized)
  const recentActivity = await db
    .select({
      firstName: users.firstName,
      city: auctions.city,
      categoryName: categories.name,
      savings: sql<number>`(${payments.originalAmountCents} - ${payments.finalAmountCents})`,
      completedAt: payments.paidAt,
    })
    .from(payments)
    .innerJoin(auctions, eq(payments.auctionId, auctions.id))
    .innerJoin(users, eq(payments.clientUserId, users.id))
    .leftJoin(sql`auction_services`, sql`auction_services.auction_id = ${auctions.id}`)
    .leftJoin(sql`services`, sql`services.id = auction_services.service_id`)
    .leftJoin(categories, sql`categories.id = services.category_id`)
    .where(eq(payments.status, 'paid'))
    .orderBy(desc(payments.paidAt))
    .limit(4);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[var(--border)]">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-base">R</span>
            </div>
            <span className="text-xl font-extrabold text-[var(--foreground)]">
              Ri<span className="text-[var(--primary)]">basta</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--muted)]">
            <Link href="/come-funziona" className="hover:text-[var(--foreground)] transition-colors">Come funziona</Link>
            <Link href="/categorie" className="hover:text-[var(--foreground)] transition-colors">Categorie</Link>
            <Link href="/aste-pubbliche" className="hover:text-[var(--foreground)] transition-colors">Aste attive</Link>
            <Link href="/faq" className="hover:text-[var(--foreground)] transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-sm hidden sm:inline-flex">Accedi</Link>
            <Link href="/registrati" className="btn btn-primary text-sm shadow-md shadow-blue-500/20">Inizia gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <div className="relative container-app py-16 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur text-white text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {stats?.completedAuctions || 0} lavori completati · {stats?.totalPros || 0} professionisti
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]">
                Il professionista giusto,<br />
                al <span className="text-amber-300">miglior prezzo</span>
              </h1>
              <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-lg">
                Pubblica il lavoro che ti serve, ricevi offerte competitive da professionisti verificati
                e scegli quella che fa per te. <strong className="text-white">Paghi sempre meno del previsto.</strong>
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/registrati" className="btn bg-white text-blue-700 font-bold px-6 py-3.5 text-base hover:bg-blue-50 shadow-lg shadow-black/10 rounded-xl hover-lift">
                  Pubblica un&apos;asta gratis →
                </Link>
                <Link href="/come-funziona" className="btn bg-white/10 text-white border border-white/25 px-6 py-3.5 text-base hover:bg-white/20 backdrop-blur rounded-xl">
                  Come funziona?
                </Link>
              </div>
              {stats && stats.totalSavings > 0 && (
                <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/15 backdrop-blur border border-emerald-400/30">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="text-xs text-emerald-200 font-medium">Risparmio totale clienti</div>
                    <div className="text-lg font-bold text-white">€{((stats.totalSavings) / 100).toLocaleString('it-IT')}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Example auction card */}
            <div className="hidden md:block animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm ml-auto">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🏗️</span>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Ristrutturazione bagno completa</div>
                    <div className="text-xs text-gray-500">Budget: €5.000</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Mario Rossi', amount: 4200, rating: 4.8, winning: false },
                    { name: 'Giuseppe Verdi', amount: 3800, rating: 4.5, winning: false },
                    { name: 'Francesco Bianchi', amount: 3500, rating: 4.9, winning: true },
                  ].map((bid) => (
                    <div key={bid.name} className={`flex items-center justify-between p-3 rounded-xl transition-all ${bid.winning ? 'bg-emerald-50 ring-2 ring-emerald-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                          {bid.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{bid.name}</div>
                          <div className="text-[11px] text-gray-500">⭐ {bid.rating}</div>
                        </div>
                      </div>
                      <div className={`font-bold ${bid.winning ? 'text-emerald-600 text-lg' : 'text-gray-700'}`}>
                        €{bid.amount.toLocaleString('it-IT')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Prezzo finale</span>
                  <div>
                    <span className="text-xl font-extrabold text-emerald-600">€4.250</span>
                    <span className="text-xs text-emerald-600 ml-1 font-semibold">-15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-8 bg-white border-b border-[var(--border)]">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="text-2xl shrink-0">{b.icon}</div>
                <div>
                  <div className="font-bold text-sm text-[var(--foreground)]">{b.title}</div>
                  <div className="text-xs text-[var(--muted)]">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Qualsiasi servizio ti serva</h2>
            <p className="mt-3 text-[var(--muted)] max-w-md mx-auto text-lg">
              26 categorie di professionisti pronti a competere per offrirti il miglior prezzo.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {topCategories.map((cat) => (
              <Link key={cat.id} href="/categorie" className="card p-5 text-center hover-lift cursor-pointer group">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-3 transition-transform group-hover:scale-110"
                  style={{ background: `${cat.color}15` }}
                >
                  {cat.icon}
                </div>
                <p className="text-sm font-bold text-[var(--foreground)]">{cat.name}</p>
                {cat.description && <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-2">{cat.description}</p>}
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/categorie" className="btn btn-outline px-6 hover-lift">Vedi tutte le 26 categorie →</Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-app">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Come funziona</h2>
            <p className="mt-3 text-[var(--muted)] text-lg">Tre passi per risparmiare su ogni servizio</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step) => (
              <div key={step.num} className="relative text-center group">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-4xl mb-5 transition-transform group-hover:scale-110 shadow-lg"
                  style={{ background: `${step.color}12` }}>
                  {step.icon}
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-md"
                  style={{ background: step.color }}>
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table — Ribasta vs ProntoPro */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[var(--background)]">
        <div className="container-app max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-4 uppercase tracking-wider">
              🆚 Confronto diretto
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Ribasta vs ProntoPro</h2>
            <p className="mt-3 text-[var(--muted)] text-lg">Perche scegliere noi: la differenza e nel modello di business</p>
          </div>

          <div className="card overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-3 bg-gray-50 border-b border-[var(--border)]">
              <div className="p-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Caratteristica</div>
              <div className="p-4 text-center bg-gradient-to-b from-blue-50 to-white">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-extrabold text-xs">R</span>
                  </div>
                  <span className="font-extrabold text-[var(--foreground)]">Ribasta</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <span className="font-semibold text-[var(--muted)]">ProntoPro</span>
              </div>
            </div>

            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-[var(--border)] last:border-b-0`}>
                <div className="p-4 text-sm font-medium text-[var(--foreground)]">{row.feature}</div>
                <div className={`p-4 text-center text-sm ${row.winner === 'r' ? 'bg-emerald-50/50' : ''}`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={row.winner === 'r' ? 'text-emerald-600' : 'text-gray-400'}>
                      {row.winner === 'r' ? '✓' : '○'}
                    </span>
                    <span className={`font-semibold ${row.winner === 'r' ? 'text-emerald-700' : 'text-[var(--muted)]'}`}>{row.ribasta}</span>
                  </div>
                </div>
                <div className={`p-4 text-center text-sm ${row.winner === 'p' ? 'bg-emerald-50/50' : ''}`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={row.winner === 'p' ? 'text-emerald-600' : 'text-red-400'}>
                      {row.winner === 'p' ? '✓' : '✗'}
                    </span>
                    <span className="text-[var(--muted)]">{row.pp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/registrati" className="btn btn-primary px-8 py-3 text-base shadow-md shadow-blue-500/20 hover-lift">
              Prova Ribasta gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing example */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-app max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Come si calcola il prezzo</h2>
            <p className="mt-3 text-[var(--muted)] text-lg">Tutti vincono con il sistema dell&apos;asta al ribasso</p>
          </div>

          <div className="card p-8 md:p-10">
            <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
              <div className="p-5 rounded-2xl bg-blue-50">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Il tuo budget</div>
                <div className="text-3xl font-extrabold text-blue-700">€100</div>
              </div>
              <div className="p-5 rounded-2xl bg-amber-50">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Offerta vincente</div>
                <div className="text-3xl font-extrabold text-amber-700">€60</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Prezzo finale</div>
                <div className="text-3xl font-extrabold text-emerald-700">€80</div>
                <div className="text-xs text-emerald-600 mt-1">(€100 + €60) ÷ 2</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-[var(--border)]">
              <div className="text-center p-4">
                <div className="text-sm font-bold text-[var(--foreground)]">🏠 Il cliente paga</div>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">€80</div>
                <div className="text-xs text-[var(--success)] font-semibold mt-1">Risparmia €20 (20%)</div>
              </div>
              <div className="text-center p-4">
                <div className="text-sm font-bold text-[var(--foreground)]">🔧 Il professionista riceve</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">€75,20</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">+€15,20 extra sull&apos;offerta</div>
              </div>
              <div className="text-center p-4">
                <div className="text-sm font-bold text-[var(--foreground)]">⚙️ Ribasta</div>
                <div className="text-2xl font-extrabold text-purple-600 mt-1">€4,80</div>
                <div className="text-xs text-[var(--muted)] font-semibold mt-1">Commissione 6%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof: recent activity */}
      {recentActivity.length > 0 && (
        <section className="py-12 bg-white border-y border-[var(--border)]">
          <div className="container-app">
            <h3 className="text-center text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-6">
              👀 Attivita recente sulla piattaforma
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {recentActivity.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700">
                    <strong>{a.firstName}</strong>
                    {a.city && ` da ${a.city}`}
                    {' ha risparmiato '}
                    <strong>€{Math.round(Number(a.savings) / 100).toLocaleString('it-IT')}</strong>
                    {a.categoryName && ` su ${a.categoryName}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent auctions */}
      {recentAuctions.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container-app">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)]">Aste attive adesso</h2>
              <Link href="/aste-pubbliche" className="btn btn-outline text-sm">Vedi tutte →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentAuctions.map((a) => (
                <Link key={a.id} href="/registrati" className="card p-5 hover-lift group">
                  <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors mb-2">{a.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                    {a.city && <span>📍 {a.city}</span>}
                    <span>{a.bidCount} offerte</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-lg text-[var(--foreground)]">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(a.maxBudget / 100)}
                    </span>
                    <span className="badge bg-blue-100 text-blue-700">Attiva</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits split */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <h3 className="text-xl font-extrabold text-[var(--foreground)] mb-6">🏠 Per i clienti</h3>
              <div className="space-y-4">
                {CLIENT_BENEFITS.map(b => (
                  <div key={b.title} className="flex gap-3">
                    <span className="text-xl shrink-0">{b.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-[var(--foreground)]">{b.title}</div>
                      <div className="text-sm text-[var(--muted)]">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/registrati" className="btn btn-primary w-full mt-6 py-3 hover-lift">Crea la tua prima asta</Link>
            </div>

            <div className="card p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
              <h3 className="text-xl font-extrabold text-[var(--foreground)] mb-6">🔧 Per i professionisti</h3>
              <div className="space-y-4">
                {PRO_BENEFITS.map(b => (
                  <div key={b.title} className="flex gap-3">
                    <span className="text-xl shrink-0">{b.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-[var(--foreground)]">{b.title}</div>
                      <div className="text-sm text-[var(--muted)]">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/registrati/professionista" className="btn bg-amber-500 text-white hover:bg-amber-600 w-full mt-6 py-3 hover-lift">Registrati come professionista</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
        <div className="container-app">
          <h2 className="text-3xl md:text-4xl font-extrabold">Pronto a risparmiare?</h2>
          <p className="mt-4 text-lg text-blue-100 max-w-lg mx-auto">
            Crea la tua prima asta in 2 minuti e scopri quanto puoi risparmiare sui servizi che ti servono.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registrati" className="btn bg-white text-blue-700 font-bold px-8 py-3.5 text-base hover:bg-blue-50 shadow-lg rounded-xl hover-lift">
              Inizia gratis
            </Link>
            <Link href="/come-funziona" className="btn bg-white/10 text-white border border-white/25 px-8 py-3.5 text-base hover:bg-white/20 rounded-xl">
              Scopri di piu
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container-app">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm">R</span>
                </div>
                <span className="font-extrabold text-white text-lg">Ribasta</span>
              </div>
              <p className="text-sm leading-relaxed">La piattaforma italiana di aste al ribasso per servizi alla persona.</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Piattaforma</h4>
              <div className="space-y-2 text-sm">
                <Link href="/come-funziona" className="block hover:text-white transition-colors">Come funziona</Link>
                <Link href="/categorie" className="block hover:text-white transition-colors">Categorie</Link>
                <Link href="/aste-pubbliche" className="block hover:text-white transition-colors">Aste attive</Link>
                <Link href="/faq" className="block hover:text-white transition-colors">FAQ</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Azienda</h4>
              <div className="space-y-2 text-sm">
                <Link href="/contatti" className="block hover:text-white transition-colors">Contatti</Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/termini" className="block hover:text-white transition-colors">Termini di servizio</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Inizia ora</h4>
              <div className="space-y-2 text-sm">
                <Link href="/registrati" className="block hover:text-white transition-colors">Registrati come cliente</Link>
                <Link href="/registrati/professionista" className="block hover:text-white transition-colors">Registrati come professionista</Link>
                <Link href="/login" className="block hover:text-white transition-colors">Accedi</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 Ribasta. Tutti i diritti riservati.</p>
            <p>P.IVA: 00000000000 — Sede legale: Milano, Italia</p>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-safe">
        <Link href="/registrati" className="btn btn-primary w-full py-3.5 text-base font-bold shadow-lg shadow-blue-500/30">
          Pubblica asta gratis →
        </Link>
      </div>
    </div>
  );
}
