import Link from 'next/link';

const CATEGORIES_PREVIEW = [
  { name: 'Elettricista', icon: '⚡', color: '#EAB308' },
  { name: 'Idraulico', icon: '🔧', color: '#3B82F6' },
  { name: 'Giardiniere', icon: '🌿', color: '#10B981' },
  { name: 'Pulizie', icon: '✨', color: '#8B5CF6' },
  { name: 'Ristrutturazioni', icon: '🏗️', color: '#F97316' },
  { name: 'Climatizzazione', icon: '❄️', color: '#06B6D4' },
  { name: 'Fitness', icon: '💪', color: '#EF4444' },
  { name: 'Babysitter', icon: '👶', color: '#EC4899' },
];

const STEPS = [
  { num: '1', title: 'Pubblica', desc: 'Descrivi il lavoro che ti serve e il tuo budget massimo. Gratis, in 2 minuti.', icon: '📝' },
  { num: '2', title: 'Ricevi offerte', desc: 'I professionisti verificati competono al ribasso per offrirti il prezzo migliore.', icon: '📩' },
  { num: '3', title: 'Scegli e risparmia', desc: 'Accetta l\'offerta migliore. Paghi la media tra budget e offerta — sempre meno del previsto.', icon: '🎉' },
];

const STATS = [
  { value: '26+', label: 'Categorie di servizi' },
  { value: '6%', label: 'Commissione trasparente' },
  { value: '100%', label: 'Professionisti verificati' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">R</span>
            </div>
            <span className="text-xl font-extrabold text-[var(--foreground)]">
              Ri<span className="text-[var(--primary)]">basta</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost text-sm">
              Accedi
            </Link>
            <Link href="/registrati" className="btn btn-primary text-sm">
              Inizia gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative container-app py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              Aste al ribasso per servizi
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Il professionista giusto,<br />
              al <span className="text-amber-300">miglior prezzo</span>
            </h1>
            <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-xl">
              Pubblica il lavoro che ti serve, ricevi offerte competitive da professionisti verificati
              e scegli quella che fa per te. Paghi sempre meno del previsto.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/registrati" className="btn bg-white text-blue-700 font-bold px-6 py-3 text-base hover:bg-blue-50 shadow-lg">
                Pubblica un&apos;asta gratis
              </Link>
              <Link href="/registrati/professionista" className="btn bg-white/10 text-white border border-white/30 px-6 py-3 text-base hover:bg-white/20 backdrop-blur">
                Sei un professionista?
              </Link>
            </div>
          </div>
        </div>

        {/* Floating stats */}
        <div className="relative container-app -mt-6 pb-12">
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-center border border-white/10">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[var(--foreground)]">
              Qualsiasi servizio ti serva
            </h2>
            <p className="mt-3 text-[var(--muted)] max-w-md mx-auto">
              Da elettricisti a babysitter, da giardinieri a personal trainer. 26 categorie di professionisti pronti a competere per te.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {CATEGORIES_PREVIEW.map((cat) => (
              <div key={cat.name} className="card p-4 text-center hover:scale-[1.02] transition-transform cursor-pointer group">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-3 transition-transform group-hover:scale-110"
                  style={{ background: `${cat.color}15` }}
                >
                  {cat.icon}
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{cat.name}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/categorie" className="btn btn-outline">
              Vedi tutte le categorie
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[var(--foreground)]">
              Come funziona
            </h2>
            <p className="mt-3 text-[var(--muted)]">Tre passi per risparmiare su ogni servizio</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-3xl mb-4">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 md:right-auto md:-left-2 w-7 h-7 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for professionals */}
      <section className="py-16 md:py-24">
        <div className="container-app">
          <div className="card p-8 md:p-12 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)]">
              Sei un professionista?
            </h2>
            <p className="mt-3 text-[var(--muted)] max-w-lg mx-auto">
              Unisciti a Ribasta e ricevi richieste di lavoro nella tua zona.
              Nessun costo di iscrizione, paghi solo quando vinci un&apos;asta.
            </p>
            <Link href="/registrati/professionista" className="btn btn-primary mt-6 px-8 py-3 text-base">
              Registrati come professionista
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border)] bg-white">
        <div className="container-app">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <span className="text-white font-extrabold text-xs">R</span>
              </div>
              <span className="font-bold text-[var(--foreground)]">Ribasta</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
              <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
              <Link href="/termini" className="hover:text-[var(--foreground)]">Termini</Link>
              <Link href="/contatti" className="hover:text-[var(--foreground)]">Contatti</Link>
              <Link href="/faq" className="hover:text-[var(--foreground)]">FAQ</Link>
            </div>
            <p className="text-xs text-[var(--muted-light)]">
              2026 Ribasta. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
