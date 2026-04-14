import Link from 'next/link';

const CONTACTS = [
  { icon: '📧', title: 'Email', desc: 'Scrivici per qualsiasi domanda', value: 'info@ribasta.it' },
  { icon: '📞', title: 'Telefono', desc: 'Chiamaci durante gli orari di ufficio', value: '+39 02 1234 5678' },
  { icon: '📍', title: 'Sede', desc: 'Vieni a trovarci', value: 'Milano, Italia' },
  { icon: '🕐', title: 'Orari', desc: 'Disponibili per supporto', value: 'Lun-Ven 9:00-18:00' },
];

export default function ContactPage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <div className="text-center pt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Contattaci</h1>
        <p className="mt-3 text-[var(--muted)] text-lg">Siamo qui per aiutarti. Scegli il metodo di contatto che preferisci.</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {CONTACTS.map(c => (
          <div key={c.title} className="card p-5 text-center">
            <div className="text-2xl mb-2">{c.icon}</div>
            <h3 className="font-bold text-sm text-[var(--foreground)]">{c.title}</h3>
            <p className="text-xs text-[var(--muted)] mt-1">{c.desc}</p>
            <p className="text-sm font-semibold text-[var(--primary)] mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4">Inviaci un messaggio</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input type="text" className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" placeholder="Mario" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" placeholder="mario@email.it" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Oggetto</label>
              <input type="text" className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" placeholder="Come possiamo aiutarti?" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Messaggio</label>
              <textarea rows={5} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none resize-none" placeholder="Scrivi il tuo messaggio..." />
            </div>
            <button type="button" className="btn btn-primary w-full py-3">Invia messaggio</button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-bold mb-3">Tempi di risposta</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Email</span>
                <span className="badge bg-blue-100 text-blue-700">Entro 24 ore</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Telefono</span>
                <span className="badge bg-emerald-100 text-emerald-700">Immediato</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Form contatto</span>
                <span className="badge bg-amber-100 text-amber-700">24-48 ore</span>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <h3 className="font-bold mb-2">Hai bisogno di aiuto rapido?</h3>
            <p className="text-sm text-[var(--muted)] mb-3">Consulta le nostre domande frequenti per trovare risposte immediate</p>
            <Link href="/faq" className="btn btn-primary text-sm">Vai alle FAQ →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
