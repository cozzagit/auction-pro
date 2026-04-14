export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-[var(--foreground)]">Privacy Policy</h1>
      <div className="card p-8 space-y-4 text-sm text-[var(--muted)] leading-relaxed">
        <p>La presente informativa descrive le modalita di gestione del sito in riferimento al trattamento dei dati personali degli utenti che lo consultano.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Titolare del trattamento</h2>
        <p>Il titolare del trattamento dei dati e Ribasta S.r.l., con sede in Milano, Italia.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Dati raccolti</h2>
        <p>I dati personali raccolti comprendono: nome, cognome, indirizzo email, numero di telefono, dati di fatturazione. Per i professionisti: ragione sociale, partita IVA, indirizzo sede.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Finalita del trattamento</h2>
        <p>I dati vengono trattati per: erogazione del servizio, gestione degli account, comunicazioni relative alle aste, adempimenti legali e fiscali.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Conservazione dei dati</h2>
        <p>I dati personali saranno conservati per il periodo necessario all&apos;erogazione del servizio e per gli obblighi di legge.</p>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Diritti dell&apos;interessato</h2>
        <p>L&apos;utente ha diritto di accesso, rettifica, cancellazione, limitazione, portabilita e opposizione al trattamento dei propri dati personali.</p>
        <p className="text-xs text-[var(--muted-light)]">Ultimo aggiornamento: Aprile 2026</p>
      </div>
    </div>
  );
}
