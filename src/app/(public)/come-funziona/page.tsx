import Link from 'next/link';

const STEPS = [
  { icon: '📝', color: '#3B82F6', title: 'Crea la tua Asta', desc: 'Descrivi il servizio che ti serve e indica il tuo budget massimo. Piu dettagli fornisci, migliori saranno le offerte che riceverai.' },
  { icon: '🔍', color: '#10B981', title: 'I Professionisti Vedono', desc: 'I professionisti qualificati nella tua zona vedono la tua richiesta e valutano se possono offrire il servizio al prezzo giusto.' },
  { icon: '📉', color: '#F59E0B', title: 'Asta al Ribasso', desc: 'I professionisti competono offrendo prezzi sempre piu bassi. Tu ricevi il miglior prezzo possibile senza alzare un dito.' },
  { icon: '✅', color: '#8B5CF6', title: 'Scegli e Conferma', desc: 'Scegli l\'offerta migliore, conferma il pagamento e ricevi i contatti del professionista per fissare l\'appuntamento.' },
];

const FAQ_ITEMS = [
  { q: 'Quanto costa usare Ribasta?', a: 'Per i clienti e completamente gratuito. I professionisti pagano una commissione trasparente del 6% solo sul prezzo finale quando completano un lavoro. Nessun costo di iscrizione o abbonamento.' },
  { q: 'Come funziona il calcolo del prezzo finale?', a: 'Il prezzo finale e sempre la media matematica tra il budget iniziale del cliente e l\'offerta piu bassa accettata. Esempio: budget €100 + offerta €60 = prezzo finale €80.' },
  { q: 'Perche conviene ai professionisti?', a: 'I professionisti guadagnano sempre piu di quanto offrono. Nell\'esempio sopra, offrendo €60 ricevono €75,20 (€80 - 6% commissione), guadagnando €15,20 extra.' },
  { q: 'Come sono verificati i professionisti?', a: 'Tutti i professionisti passano un processo di verifica che include controllo documenti, partita IVA, assicurazioni e referenze. Solo dopo l\'approvazione possono fare offerte.' },
];

const SERVICES_PREVIEW = [
  { icon: '⚡', name: 'Impianti Elettrici', items: ['Installazione interruttori e prese', 'Sistemi di illuminazione', 'Quadri elettrici', 'Riparazioni elettriche'], color: '#EAB308' },
  { icon: '🔧', name: 'Idraulica', items: ['Riparazione perdite', 'Installazione sanitari', 'Sostituzione rubinetteria', 'Scaldasalviette'], color: '#3B82F6' },
  { icon: '🌿', name: 'Giardinaggio', items: ['Taglio prato', 'Potatura siepi', 'Piantumazione', 'Impianti irrigazione'], color: '#10B981' },
];

export default function ComeFunzionaPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--foreground)] leading-tight">
          Come Funziona <span className="text-[var(--primary)]">Ribasta</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          La prima piattaforma italiana di aste al ribasso per servizi alla persona.
          I professionisti competono per offrirti il miglior prezzo.
        </p>
      </section>

      {/* 4 Steps */}
      <section>
        <h2 className="text-2xl font-extrabold text-center mb-10">Il processo in 4 semplici passi</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="card p-6 text-center relative group hover:scale-[1.02] transition-transform">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4 shadow-sm transition-transform group-hover:scale-110"
                style={{ background: `${step.color}12` }}>
                {step.icon}
              </div>
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow" style={{ background: step.color }}>
                {i + 1}
              </div>
              <h3 className="font-bold text-[var(--foreground)] mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing explanation */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-[var(--border)]">
        <h2 className="text-2xl font-extrabold text-center mb-4">Come funziona l&apos;asta al ribasso</h2>
        <p className="text-center text-[var(--muted)] mb-10 max-w-xl mx-auto">
          Il prezzo finale e sempre la media tra il tuo budget e l&apos;offerta vincente. Tutti ci guadagnano.
        </p>

        <div className="max-w-3xl mx-auto">
          {/* Visual example */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="text-center p-6 rounded-2xl bg-blue-50">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3 text-xl">🎯</div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Tu fissi il budget</div>
              <div className="text-3xl font-extrabold text-blue-700">€100</div>
              <p className="text-xs text-blue-500 mt-2">Il massimo che vuoi spendere</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-amber-50">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3 text-xl">📉</div>
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">I prezzi scendono</div>
              <div className="text-3xl font-extrabold text-amber-700">€60</div>
              <p className="text-xs text-amber-500 mt-2">L&apos;offerta piu bassa vince</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-emerald-50">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3 text-xl">💰</div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Prezzo finale</div>
              <div className="text-3xl font-extrabold text-emerald-700">€80</div>
              <p className="text-xs text-emerald-500 mt-2">(€100 + €60) ÷ 2</p>
            </div>
          </div>

          {/* Who wins what */}
          <div className="card p-6 bg-gray-50">
            <h3 className="font-bold text-center mb-4">Tutti vincono</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-bold text-blue-600">🏠 Cliente paga</div>
                <div className="text-2xl font-extrabold mt-1">€80</div>
                <div className="text-xs text-emerald-600 font-semibold">Risparmia €20 (20%)</div>
              </div>
              <div>
                <div className="font-bold text-emerald-600">🔧 Professionista riceve</div>
                <div className="text-2xl font-extrabold mt-1">€75,20</div>
                <div className="text-xs text-emerald-600 font-semibold">+€15,20 rispetto all&apos;offerta</div>
              </div>
              <div>
                <div className="font-bold text-purple-600">⚙️ Piattaforma</div>
                <div className="text-2xl font-extrabold mt-1">€4,80</div>
                <div className="text-xs text-[var(--muted)]">Commissione 6%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section>
        <h2 className="text-2xl font-extrabold text-center mb-10">Servizi disponibili</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {SERVICES_PREVIEW.map(svc => (
            <div key={svc.name} className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${svc.color}15` }}>{svc.icon}</div>
                <h3 className="font-bold text-[var(--foreground)]">{svc.name}</h3>
              </div>
              <ul className="space-y-2">
                {svc.items.map(item => (
                  <li key={item} className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/categorie" className="btn btn-outline">Vedi tutte le 26 categorie →</Link>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl font-extrabold text-center mb-10">Domande frequenti</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="card p-5">
              <h3 className="font-bold text-[var(--foreground)] mb-2">{item.q}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pb-8">
        <h2 className="text-2xl font-extrabold mb-4">Pronto a iniziare?</h2>
        <p className="text-[var(--muted)] mb-6">Crea la tua prima asta e scopri quanto puoi risparmiare</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/registrati" className="btn btn-primary px-8 py-3 text-base shadow-md shadow-blue-500/20">Crea la tua prima asta</Link>
          <Link href="/registrati/professionista" className="btn btn-outline px-8 py-3 text-base">Registrati come professionista</Link>
        </div>
      </section>
    </div>
  );
}
