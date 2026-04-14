export default function TerminiPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)]">Termini di Servizio</h1>
      <div className="card p-8 space-y-4 text-sm text-[var(--muted)] leading-relaxed">
        <p>I presenti Termini di Servizio regolano l&apos;utilizzo della piattaforma Ribasta.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Descrizione del servizio</h2>
        <p>Ribasta e una piattaforma che mette in contatto clienti e professionisti attraverso un sistema di aste al ribasso. Il cliente pubblica una richiesta di servizio con un budget massimo, i professionisti competono offrendo prezzi al ribasso.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Formula del prezzo</h2>
        <p>Il prezzo finale del servizio e calcolato come media aritmetica tra il budget massimo indicato dal cliente e l&apos;offerta vincente del professionista. Su tale importo viene applicata una commissione del 6% a carico del professionista.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Registrazione</h2>
        <p>Per utilizzare i servizi interattivi della piattaforma e necessaria la registrazione. I dati forniti devono essere veritieri e aggiornati. L&apos;utente e responsabile della riservatezza delle proprie credenziali.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Professionisti</h2>
        <p>I professionisti devono fornire dati aziendali reali (partita IVA, assicurazione se applicabile). La verifica e a carico del team Ribasta. Solo i professionisti approvati possono fare offerte.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Pagamenti</h2>
        <p>I pagamenti vengono processati attraverso gateway sicuri. I contatti tra cliente e professionista vengono rilasciati solo dopo la conferma del pagamento.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Responsabilita</h2>
        <p>Ribasta agisce come intermediario e non e responsabile della qualita del lavoro svolto dal professionista. In caso di controversie, il team di supporto mediera tra le parti.</p>
        <p className="text-xs text-[var(--muted-light)]">Ultimo aggiornamento: Aprile 2026</p>
      </div>
    </div>
  );
}
