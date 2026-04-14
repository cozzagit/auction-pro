import Link from 'next/link';

const FAQ_SECTIONS = [
  {
    title: 'Domande Generali',
    icon: '❓',
    color: '#3B82F6',
    items: [
      { q: 'Cos\'e Ribasta e come funziona?', a: 'Ribasta e una piattaforma innovativa che connette clienti e professionisti attraverso un sistema di aste competitive. I clienti pubblicano le loro richieste di servizi, i professionisti fanno le loro offerte al ribasso, e il cliente sceglie la migliore. Il prezzo finale e calcolato come media tra il budget iniziale e l\'offerta vincente.' },
      { q: 'E gratuito utilizzare la piattaforma?', a: 'Per i clienti, la registrazione e la pubblicazione delle aste sono completamente gratuite. Per i professionisti, la registrazione e gratuita ma viene applicata una commissione trasparente del 6% solo sulle transazioni completate con successo.' },
      { q: 'In quali zone geografiche operate?', a: 'Attualmente operiamo in tutta Italia, con particolare focus nelle principali citta. Stiamo costantemente espandendo la nostra copertura geografica per servire sempre piu clienti e professionisti.' },
      { q: 'Posso usare la piattaforma senza registrarmi?', a: 'Puoi consultare le aste pubbliche e le categorie senza registrarti, ma per creare aste o fare offerte e necessaria la registrazione gratuita.' },
    ],
  },
  {
    title: 'Per i Clienti',
    icon: '🏠',
    color: '#10B981',
    items: [
      { q: 'Come faccio a creare la mia prima asta?', a: 'Dopo la registrazione, clicca su "Crea Asta", seleziona la categoria di servizio, compila i dettagli della richiesta, imposta il tuo budget massimo e pubblica. I professionisti inizieranno a fare le loro offerte entro poche ore.' },
      { q: 'Come scelgo il professionista giusto?', a: 'Valuta le offerte considerando il prezzo, le recensioni, il badge verificato e il messaggio di presentazione. Ogni professionista ha un profilo dettagliato con feedback di clienti precedenti.' },
      { q: 'Cosa succede se non sono soddisfatto del lavoro?', a: 'Abbiamo un sistema di garanzie che protegge i clienti. Se il lavoro non soddisfa le aspettative, puoi aprire una controversia e il nostro team di supporto mediera per trovare una soluzione equa.' },
      { q: 'Posso modificare i dettagli dell\'asta dopo la pubblicazione?', a: 'Puoi modificare alcuni dettagli dell\'asta finche non hai accettato un\'offerta. Una volta accettata un\'offerta, i termini diventano vincolanti per entrambe le parti.' },
    ],
  },
  {
    title: 'Per i Professionisti',
    icon: '🔧',
    color: '#8B5CF6',
    items: [
      { q: 'Come faccio a diventare un professionista verificato?', a: 'Registrati come professionista, completa il tuo profilo con dati aziendali, partita IVA, e indica se hai assicurazione e abilitazione. Il nostro team verifichera le informazioni entro 24-48 ore.' },
      { q: 'Quante offerte posso fare?', a: 'Non c\'e limite al numero di aste su cui puoi fare offerte. Ti consigliamo di concentrarti su quelle che corrispondono alle tue competenze per aumentare le probabilita di successo.' },
      { q: 'Come funziona il sistema di commissioni?', a: 'Applichiamo una commissione del 6% solo sui lavori completati con successo. Non ci sono costi nascosti: se non ottieni lavori, non paghi nulla. Nessun abbonamento.' },
      { q: 'Perche guadagno piu di quanto offro?', a: 'Perche il prezzo finale e la media tra il budget del cliente e la tua offerta. Se il budget e €100 e tu offri €60, il prezzo finale sara €80. Tu ricevi €80 meno il 6% = €75,20. Hai offerto €60 ma guadagni €75,20!' },
    ],
  },
  {
    title: 'Pagamenti e Sicurezza',
    icon: '🔒',
    color: '#F59E0B',
    items: [
      { q: 'Quali metodi di pagamento accettate?', a: 'Accettiamo carte di credito, carte di debito e bonifici bancari. Tutti i pagamenti sono processati attraverso gateway sicuri e certificati.' },
      { q: 'Quando viene effettuato il pagamento?', a: 'Il pagamento viene processato quando il cliente accetta un\'offerta. I contatti del professionista vengono rilasciati solo dopo la conferma del pagamento.' },
      { q: 'I miei dati personali sono sicuri?', a: 'Si, utilizziamo crittografia avanzata per proteggere tutti i dati. Non condividiamo mai informazioni personali con terze parti senza il tuo consenso esplicito.' },
      { q: 'I contatti sono protetti?', a: 'I contatti di clienti e professionisti vengono scambiati solo dopo il pagamento confermato. Questo protegge entrambe le parti da contatti non desiderati.' },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      <div className="text-center pt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)]">Domande Frequenti</h1>
        <p className="mt-3 text-[var(--muted)] text-lg">Trova rapidamente le risposte alle domande piu comuni</p>
      </div>

      {FAQ_SECTIONS.map(section => (
        <section key={section.title}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${section.color}15` }}>
              {section.icon}
            </div>
            <h2 className="text-xl font-extrabold text-[var(--foreground)]">{section.title}</h2>
          </div>
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div key={i} className="card p-5 hover:border-[var(--primary)]/20 transition-colors">
                <h3 className="font-bold text-[var(--foreground)] mb-2">{item.q}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="card p-8 text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <h3 className="text-xl font-extrabold text-[var(--foreground)] mb-2">Non hai trovato la risposta?</h3>
        <p className="text-[var(--muted)] mb-4">Il nostro team di supporto e pronto ad aiutarti</p>
        <Link href="/contatti" className="btn btn-primary">Contattaci</Link>
      </div>
    </div>
  );
}
