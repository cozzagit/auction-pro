import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) process.env[t.substring(0, i)] = t.substring(i + 1);
  }
} catch { /* */ }

async function main() {
  const { db } = await import('../src/lib/db');
  const { users, professionals, professionalCategories, categories, services, auctions, auctionServices, bids, payments, contracts, reviews } = await import('../src/lib/db/schema');
  const { hash } = await import('bcryptjs');
  const { eq, sql } = await import('drizzle-orm');

  console.log('🌱 Seeding demo data (category-aware)...\n');

  const passwordHash = await hash('Demo2026!', 12);
  const cats = await db.select().from(categories);
  const catMap = new Map(cats.map(c => [c.slug, c]));
  const svcs = await db.select().from(services);
  if (cats.length === 0) { console.error('❌ Run seed-categories first!'); process.exit(1); }

  // ── Customers (20) ──
  console.log('👥 Creating customers...');
  const CUSTOMERS = [
    { firstName: 'Marco', lastName: 'Rossi', city: 'Milano', province: 'MI' },
    { firstName: 'Laura', lastName: 'Bianchi', city: 'Roma', province: 'RM' },
    { firstName: 'Giuseppe', lastName: 'Verdi', city: 'Torino', province: 'TO' },
    { firstName: 'Francesca', lastName: 'Russo', city: 'Napoli', province: 'NA' },
    { firstName: 'Alessandro', lastName: 'Ferrari', city: 'Bologna', province: 'BO' },
    { firstName: 'Chiara', lastName: 'Esposito', city: 'Firenze', province: 'FI' },
    { firstName: 'Luca', lastName: 'Romano', city: 'Bergamo', province: 'BG' },
    { firstName: 'Elena', lastName: 'Colombo', city: 'Brescia', province: 'BS' },
    { firstName: 'Andrea', lastName: 'Ricci', city: 'Padova', province: 'PD' },
    { firstName: 'Valentina', lastName: 'Marino', city: 'Verona', province: 'VR' },
    { firstName: 'Davide', lastName: 'Greco', city: 'Genova', province: 'GE' },
    { firstName: 'Sara', lastName: 'Bruno', city: 'Palermo', province: 'PA' },
    { firstName: 'Matteo', lastName: 'Galli', city: 'Monza', province: 'MB' },
    { firstName: 'Giulia', lastName: 'Costa', city: 'Como', province: 'CO' },
    { firstName: 'Simone', lastName: 'Fontana', city: 'Parma', province: 'PR' },
    { firstName: 'Anna', lastName: 'Conti', city: 'Modena', province: 'MO' },
    { firstName: 'Roberto', lastName: 'Mariani', city: 'Pisa', province: 'PI' },
    { firstName: 'Martina', lastName: 'Rizzo', city: 'Catania', province: 'CT' },
    { firstName: 'Paolo', lastName: 'Lombardi', city: 'Bari', province: 'BA' },
    { firstName: 'Silvia', lastName: 'Moretti', city: 'Lecco', province: 'LC' },
  ];

  const customerIds: string[] = [];
  for (const c of CUSTOMERS) {
    const email = `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@demo.ribasta.it`;
    const [user] = await db.insert(users).values({ email, passwordHash, firstName: c.firstName, lastName: c.lastName, city: c.city, province: c.province, role: 'customer' }).onConflictDoNothing().returning();
    if (user) customerIds.push(user.id);
  }
  console.log(`  ✓ ${customerIds.length} clienti`);

  // ── Professionals (30 — 2-3 per category for realistic bidding) ──
  console.log('🔧 Creating professionals...');
  const PRO_DATA: Array<{ firstName: string; lastName: string; biz: string; vat: string; city: string; province: string; catSlugs: string[]; ins: boolean; lic: boolean; exp: string; desc: string }> = [
    // Elettricisti (3)
    { firstName: 'Mario', lastName: 'Volta', biz: 'Volta Impianti Srl', vat: 'IT01234500001', city: 'Milano', province: 'MI', catSlugs: ['elettricista'], ins: true, lic: true, exp: '15 anni', desc: 'Elettricista specializzato in impianti civili e industriali.' },
    { firstName: 'Pietro', lastName: 'Ampere', biz: 'ElettroService', vat: 'IT01234500002', city: 'Torino', province: 'TO', catSlugs: ['elettricista'], ins: true, lic: true, exp: '10 anni', desc: 'Installazione e manutenzione impianti elettrici certificati.' },
    { firstName: 'Sergio', lastName: 'Watt', biz: 'Watt Elettrica', vat: 'IT01234500003', city: 'Roma', province: 'RM', catSlugs: ['elettricista'], ins: true, lic: true, exp: '8 anni', desc: 'Pronto intervento elettrico, quadri, domotica.' },
    // Idraulici (3)
    { firstName: 'Giovanni', lastName: 'Tubini', biz: 'Idraulica Rapida', vat: 'IT01234500004', city: 'Milano', province: 'MI', catSlugs: ['idraulica'], ins: true, lic: true, exp: '12 anni', desc: 'Pronto intervento idraulico 24/7. Riparazioni e installazioni.' },
    { firstName: 'Carlo', lastName: 'Rubinetti', biz: 'AcquaPro Srl', vat: 'IT01234500005', city: 'Bologna', province: 'BO', catSlugs: ['idraulica'], ins: true, lic: true, exp: '18 anni', desc: 'Specialisti in impianti idrosanitari e riscaldamento.' },
    { firstName: 'Fabio', lastName: 'Fontaniere', biz: 'Idraulica Fontaniere', vat: 'IT01234500006', city: 'Napoli', province: 'NA', catSlugs: ['idraulica'], ins: true, lic: false, exp: '7 anni', desc: 'Riparazioni perdite, sostituzione sanitari e rubinetteria.' },
    // Giardinieri (3)
    { firstName: 'Luigi', lastName: 'Prato', biz: 'Verde Vivo Giardini', vat: 'IT01234500007', city: 'Monza', province: 'MB', catSlugs: ['giardinaggio'], ins: true, lic: false, exp: '8 anni', desc: 'Progettazione e manutenzione giardini, potature, irrigazione.' },
    { firstName: 'Marco', lastName: 'Giardino', biz: 'GreenTeam', vat: 'IT01234500008', city: 'Bergamo', province: 'BG', catSlugs: ['giardinaggio'], ins: true, lic: false, exp: '12 anni', desc: 'Manutenzione aree verdi, piantumazione, taglio siepi.' },
    { firstName: 'Alberto', lastName: 'Fiori', biz: 'Il Giardiniere', vat: 'IT01234500009', city: 'Firenze', province: 'FI', catSlugs: ['giardinaggio'], ins: false, lic: false, exp: '5 anni', desc: 'Taglio erba, potatura, piccoli lavori di giardinaggio.' },
    // Pulizie (2)
    { firstName: 'Rosa', lastName: 'Pulito', biz: 'Pulizie Perfette Sas', vat: 'IT01234500010', city: 'Roma', province: 'RM', catSlugs: ['pulizie'], ins: true, lic: false, exp: '10 anni', desc: 'Pulizia professionale per case, uffici e post-cantiere.' },
    { firstName: 'Maria', lastName: 'Splendore', biz: 'Crystal Clean', vat: 'IT01234500011', city: 'Milano', province: 'MI', catSlugs: ['pulizie'], ins: true, lic: false, exp: '6 anni', desc: 'Servizi di pulizia ordinaria e straordinaria.' },
    // Ristrutturazioni (2)
    { firstName: 'Franco', lastName: 'Muratore', biz: 'Edil Franco Srl', vat: 'IT01234500012', city: 'Torino', province: 'TO', catSlugs: ['ristrutturazioni'], ins: true, lic: true, exp: '20 anni', desc: 'Ristrutturazioni chiavi in mano, impresa edile.' },
    { firstName: 'Enzo', lastName: 'Costruire', biz: 'Costruzioni Enzo', vat: 'IT01234500013', city: 'Roma', province: 'RM', catSlugs: ['ristrutturazioni'], ins: true, lic: true, exp: '15 anni', desc: 'Ristrutturazioni appartamenti, bagni, cucine.' },
    // Climatizzazione (2)
    { firstName: 'Antonio', lastName: 'Clima', biz: 'ClimaTop Srl', vat: 'IT01234500014', city: 'Bologna', province: 'BO', catSlugs: ['climatizzazione'], ins: true, lic: true, exp: '10 anni', desc: 'Installazione climatizzatori, pompe di calore, VMC.' },
    { firstName: 'Daniele', lastName: 'Freddo', biz: 'AirCool Service', vat: 'IT01234500015', city: 'Firenze', province: 'FI', catSlugs: ['climatizzazione'], ins: true, lic: true, exp: '8 anni', desc: 'Manutenzione e installazione impianti di climatizzazione.' },
    // Fitness (2)
    { firstName: 'Teresa', lastName: 'Fit', biz: 'FitLife Training', vat: 'IT01234500016', city: 'Milano', province: 'MI', catSlugs: ['fitness'], ins: true, lic: true, exp: '6 anni', desc: 'Personal trainer certificata CONI. Programmi a domicilio.' },
    { firstName: 'Luca', lastName: 'Muscoli', biz: 'Strong Personal', vat: 'IT01234500017', city: 'Roma', province: 'RM', catSlugs: ['fitness'], ins: true, lic: true, exp: '9 anni', desc: 'Personal trainer, preparazione atletica, dimagrimento.' },
    // Informatica (2)
    { firstName: 'Marco', lastName: 'Byte', biz: 'TechAssist Italia', vat: 'IT01234500018', city: 'Milano', province: 'MI', catSlugs: ['informatica'], ins: false, lic: false, exp: '8 anni', desc: 'Assistenza informatica, riparazione PC e Mac.' },
    { firstName: 'Paolo', lastName: 'Chip', biz: 'PC Doctor', vat: 'IT01234500019', city: 'Torino', province: 'TO', catSlugs: ['informatica'], ins: false, lic: false, exp: '12 anni', desc: 'Riparazione computer, configurazione reti, recupero dati.' },
    // Fotografia (2)
    { firstName: 'Carla', lastName: 'Scatto', biz: 'Carla Foto Studio', vat: 'IT01234500020', city: 'Roma', province: 'RM', catSlugs: ['fotografia'], ins: true, lic: false, exp: '12 anni', desc: 'Fotografa per matrimoni, eventi, ritratti.' },
    { firstName: 'Filippo', lastName: 'Flash', biz: 'Flash Photography', vat: 'IT01234500021', city: 'Firenze', province: 'FI', catSlugs: ['fotografia'], ins: true, lic: false, exp: '7 anni', desc: 'Fotografia eventi, corporate, food.' },
    // Traslochi (2)
    { firstName: 'Piero', lastName: 'Trasloco', biz: 'Traslochi Express', vat: 'IT01234500022', city: 'Napoli', province: 'NA', catSlugs: ['traslochi'], ins: true, lic: false, exp: '15 anni', desc: 'Traslochi nazionali, smontaggio mobili, deposito.' },
    { firstName: 'Remo', lastName: 'Trasporto', biz: 'MoveFast Srl', vat: 'IT01234500023', city: 'Milano', province: 'MI', catSlugs: ['traslochi'], ins: true, lic: false, exp: '10 anni', desc: 'Traslochi rapidi con personale qualificato.' },
    // Babysitter (2)
    { firstName: 'Lucia', lastName: 'Bimbi', biz: 'Lucia Babysitting', vat: 'IT01234500024', city: 'Bergamo', province: 'BG', catSlugs: ['babysitter'], ins: true, lic: true, exp: '5 anni', desc: 'Babysitter certificata con esperienza in pedagogia infantile.' },
    { firstName: 'Marta', lastName: 'Piccoli', biz: 'Happy Kids', vat: 'IT01234500025', city: 'Milano', province: 'MI', catSlugs: ['babysitter'], ins: true, lic: true, exp: '8 anni', desc: 'Assistenza bambini, aiuto compiti, attivita ludiche.' },
    // Consulenze (2)
    { firstName: 'Stefano', lastName: 'Legge', biz: 'Studio Legge & Fisco', vat: 'IT01234500026', city: 'Milano', province: 'MI', catSlugs: ['consulenze'], ins: true, lic: true, exp: '18 anni', desc: 'Consulenze legali, fiscali e amministrative.' },
    { firstName: 'Giulia', lastName: 'Avvocato', biz: 'Consulenza360', vat: 'IT01234500027', city: 'Roma', province: 'RM', catSlugs: ['consulenze'], ins: true, lic: true, exp: '10 anni', desc: 'Consulenza legale e contrattualistica per privati.' },
    // Benessere (2)
    { firstName: 'Elisa', lastName: 'Relax', biz: 'Oasi del Benessere', vat: 'IT01234500028', city: 'Verona', province: 'VR', catSlugs: ['benessere'], ins: true, lic: true, exp: '7 anni', desc: 'Massaggi professionali, riflessologia, trattamenti olistici.' },
    { firstName: 'Silvia', lastName: 'Zen', biz: 'Harmony Wellness', vat: 'IT01234500029', city: 'Firenze', province: 'FI', catSlugs: ['benessere'], ins: true, lic: true, exp: '5 anni', desc: 'Massaggi rilassanti, aromaterapia a domicilio.' },
    // Sicurezza (2)
    { firstName: 'Claudio', lastName: 'Sicuro', biz: 'SecurHome Srl', vat: 'IT01234500030', city: 'Padova', province: 'PD', catSlugs: ['sicurezza'], ins: true, lic: true, exp: '14 anni', desc: 'Allarmi, videosorveglianza, controllo accessi.' },
    // Catering (2)
    { firstName: 'Federica', lastName: 'Chef', biz: 'Chef a Domicilio', vat: 'IT01234500031', city: 'Firenze', province: 'FI', catSlugs: ['catering'], ins: true, lic: true, exp: '9 anni', desc: 'Catering per eventi, cene private, chef a domicilio.' },
  ];

  // Map: catSlug -> list of proUserIds
  const proByCat = new Map<string, string[]>();

  for (const p of PRO_DATA) {
    const email = `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@pro.ribasta.it`;
    const [user] = await db.insert(users).values({
      email, passwordHash, firstName: p.firstName, lastName: p.lastName,
      city: p.city, province: p.province, phone: `+39 3${String(Math.floor(10000000 + Math.random() * 89999999))}`,
      role: 'professional',
    }).onConflictDoNothing().returning();
    if (!user) continue;

    const rating = +(3.5 + Math.random() * 1.5).toFixed(2);
    const totalJobs = Math.floor(5 + Math.random() * 80);
    const [pro] = await db.insert(professionals).values({
      userId: user.id, businessName: p.biz, vatNumber: p.vat,
      city: p.city, province: p.province, description: p.desc,
      experience: p.exp, hasInsurance: p.ins, hasLicense: p.lic,
      status: 'approved', rating, totalJobs,
    }).onConflictDoNothing().returning();

    if (pro) {
      for (const slug of p.catSlugs) {
        const cat = catMap.get(slug);
        if (cat) {
          await db.insert(professionalCategories).values({ professionalId: pro.id, categoryId: cat.id }).onConflictDoNothing();
          if (!proByCat.has(slug)) proByCat.set(slug, []);
          proByCat.get(slug)!.push(user.id);
        }
      }
    }
  }
  console.log(`  ✓ ${PRO_DATA.length} professionisti (matching per categoria)`);

  // ── Auctions (100) ──
  console.log('📋 Creating auctions...');
  const TEMPLATES = [
    { title: 'Rifacimento impianto elettrico appartamento', catSlug: 'elettricista', budget: [800, 5000], desc: 'Necessito di rifare l\'impianto elettrico del mio appartamento di {mq} mq.' },
    { title: 'Installazione punti luce e prese', catSlug: 'elettricista', budget: [200, 800], desc: 'Installare nuovi punti luce e prese in {rooms} stanze.' },
    { title: 'Sostituzione quadro elettrico', catSlug: 'elettricista', budget: [300, 1200], desc: 'Sostituzione quadro elettrico obsoleto con nuovo certificato.' },
    { title: 'Riparazione perdita bagno', catSlug: 'idraulica', budget: [150, 600], desc: 'Perdita d\'acqua nel bagno, probabilmente tubatura sotto lavabo.' },
    { title: 'Ristrutturazione bagno completa', catSlug: 'idraulica', budget: [3000, 8000], desc: 'Rifare completamente il bagno: sanitari, doccia, piastrelle. {mq} mq.' },
    { title: 'Sostituzione rubinetteria cucina', catSlug: 'idraulica', budget: [100, 400], desc: 'Sostituzione rubinetto cucina con miscelatore nuovo.' },
    { title: 'Manutenzione giardino mensile', catSlug: 'giardinaggio', budget: [100, 400], desc: 'Manutenzione mensile giardino {mq} mq. Taglio erba, siepi.' },
    { title: 'Progettazione giardino con irrigazione', catSlug: 'giardinaggio', budget: [1500, 5000], desc: 'Progettare giardino {mq} mq con irrigazione automatico.' },
    { title: 'Potatura alberi alto fusto', catSlug: 'giardinaggio', budget: [200, 800], desc: 'Potatura di 3 alberi alto fusto nel giardino condominiale.' },
    { title: 'Pulizia appartamento post trasloco', catSlug: 'pulizie', budget: [150, 500], desc: 'Appartamento {rooms} locali da pulire a fondo dopo trasloco.' },
    { title: 'Pulizia ufficio settimanale', catSlug: 'pulizie', budget: [200, 600], desc: 'Pulizia settimanale ufficio {mq} mq.' },
    { title: 'Ristrutturazione cucina', catSlug: 'ristrutturazioni', budget: [5000, 15000], desc: 'Rifare la cucina: demolizione, impianti, piastrelle, mobili.' },
    { title: 'Tinteggiatura appartamento', catSlug: 'ristrutturazioni', budget: [800, 3000], desc: 'Tinteggiatura completa {rooms} locali. Pareti e soffitti.' },
    { title: 'Installazione climatizzatore', catSlug: 'climatizzazione', budget: [600, 2000], desc: 'Installazione climatizzatore dual split per {rooms} stanze.' },
    { title: 'Personal trainer a domicilio', catSlug: 'fitness', budget: [200, 600], desc: 'Personal trainer per {sessions} sessioni settimanali a domicilio.' },
    { title: 'Riparazione PC lento', catSlug: 'informatica', budget: [50, 200], desc: 'PC molto lento. Serve diagnosi, pulizia, eventuale upgrade.' },
    { title: 'Configurazione rete WiFi casa', catSlug: 'informatica', budget: [80, 300], desc: 'Configurare rete WiFi mesh per casa su 2 piani.' },
    { title: 'Servizio fotografico matrimonio', catSlug: 'fotografia', budget: [1000, 3000], desc: 'Fotografo per matrimonio. Cerimonia e ricevimento, circa 8 ore.' },
    { title: 'Trasloco bilocale', catSlug: 'traslochi', budget: [400, 1200], desc: 'Trasloco bilocale con mobili standard, 3° piano con ascensore.' },
    { title: 'Babysitter per weekend', catSlug: 'babysitter', budget: [80, 200], desc: 'Babysitter sabato sera dalle 19 alle 23. Bambino di {age} anni.' },
    { title: 'Babysitter pomeridiana', catSlug: 'babysitter', budget: [60, 150], desc: 'Babysitter 3 pomeriggi a settimana, uscita scuola. 2 bambini.' },
    { title: 'Consulenza fiscale partita IVA', catSlug: 'consulenze', budget: [100, 400], desc: 'Aprire partita IVA freelancer. Consulenza regime fiscale.' },
    { title: 'Massaggio rilassante a domicilio', catSlug: 'benessere', budget: [50, 150], desc: 'Massaggio rilassante a domicilio di {duration} minuti.' },
    { title: 'Installazione allarme casa', catSlug: 'sicurezza', budget: [500, 2000], desc: 'Sistema allarme per villetta: sensori, sirena, app smartphone.' },
    { title: 'Catering festa compleanno', catSlug: 'catering', budget: [300, 1500], desc: 'Catering per festa, {guests} invitati. Buffet + torta + bevande.' },
  ];

  const STATUSES: Array<{ s: 'active' | 'expired' | 'awarded' | 'completed' | 'in_progress'; w: number }> = [
    { s: 'active', w: 35 }, { s: 'expired', w: 10 }, { s: 'awarded', w: 15 },
    { s: 'in_progress', w: 15 }, { s: 'completed', w: 25 },
  ];
  function pickStatus() {
    const total = STATUSES.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const x of STATUSES) { r -= x.w; if (r <= 0) return x.s; }
    return 'active' as const;
  }

  const cities = CUSTOMERS.map(c => ({ city: c.city, province: c.province }));
  const auctionData: Array<{ id: string; userId: string; maxBudget: number; status: string; catSlug: string }> = [];

  for (let i = 0; i < 100; i++) {
    const tmpl = TEMPLATES[i % TEMPLATES.length];
    const customer = customerIds[i % customerIds.length];
    const loc = cities[Math.floor(Math.random() * cities.length)];
    const budgetEur = Math.round(tmpl.budget[0] + Math.random() * (tmpl.budget[1] - tmpl.budget[0]));
    const status = pickStatus();
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const expiresAt = status === 'active'
      ? new Date(Date.now() + (1 + Math.floor(Math.random() * 6)) * 86400000)
      : new Date(createdAt.getTime() + 7 * 86400000);

    const desc = tmpl.desc
      .replace('{mq}', String(30 + Math.floor(Math.random() * 120)))
      .replace('{rooms}', String(2 + Math.floor(Math.random() * 4)))
      .replace('{sessions}', String(2 + Math.floor(Math.random() * 3)))
      .replace('{age}', String(2 + Math.floor(Math.random() * 8)))
      .replace('{duration}', String([60, 90, 120][Math.floor(Math.random() * 3)]))
      .replace('{guests}', String(20 + Math.floor(Math.random() * 50)));

    const title = tmpl.title + (i >= TEMPLATES.length ? ` #${Math.floor(i / TEMPLATES.length) + 1}` : '');

    const [auction] = await db.insert(auctions).values({
      userId: customer, title, description: desc,
      maxBudget: budgetEur * 100, city: loc.city, province: loc.province,
      status, expiresAt, createdAt, updatedAt: createdAt,
      ...(status === 'completed' ? { closedAt: new Date(createdAt.getTime() + (3 + Math.floor(Math.random() * 20)) * 86400000) } : {}),
    }).returning();

    const cat = catMap.get(tmpl.catSlug);
    const catServices = svcs.filter(s => cat && s.categoryId === cat.id);
    if (catServices.length > 0) {
      const svc = catServices[Math.floor(Math.random() * catServices.length)];
      await db.insert(auctionServices).values({ auctionId: auction.id, serviceId: svc.id, parameters: {} });
    }

    auctionData.push({ id: auction.id, userId: customer, maxBudget: budgetEur * 100, status, catSlug: tmpl.catSlug });
  }
  console.log(`  ✓ 100 aste`);

  // ── Bids (ONLY from matching-category professionals) ──
  console.log('💰 Creating bids (category-matched)...');
  let bidCount = 0, paymentCount = 0, contractCount = 0, reviewCount = 0;

  for (const auction of auctionData) {
    const matchingPros = proByCat.get(auction.catSlug) || [];
    if (matchingPros.length === 0) continue;

    const numBids = auction.status === 'expired' ? Math.floor(Math.random() * 2) : Math.min(matchingPros.length, 2 + Math.floor(Math.random() * 2));
    const shuffled = [...matchingPros].sort(() => Math.random() - 0.5);
    let lowestBidId: string | null = null, lowestAmount = Infinity;

    for (let b = 0; b < numBids; b++) {
      const proId = shuffled[b];
      const bidPercent = 0.5 + Math.random() * 0.45;
      const amountCents = Math.round(auction.maxBudget * bidPercent);

      const msgs = [
        'Disponibile subito, esperienza pluriennale nel settore.',
        'Offro servizio completo con garanzia.',
        'Posso iniziare entro la settimana. Lavoro di qualita garantita.',
        'Preventivo competitivo con materiali inclusi.',
        null,
      ];

      const [bid] = await db.insert(bids).values({
        auctionId: auction.id, professionalId: proId,
        amountCents, message: msgs[Math.floor(Math.random() * msgs.length)],
        status: 'pending',
      }).returning();

      if (amountCents < lowestAmount) { lowestAmount = amountCents; lowestBidId = bid.id; }
      bidCount++;
    }

    if (lowestBidId && ['awarded', 'in_progress', 'completed'].includes(auction.status)) {
      await db.update(bids).set({ status: 'accepted' }).where(eq(bids.id, lowestBidId));
      const allBids = await db.select().from(bids).where(eq(bids.auctionId, auction.id));
      for (const ab of allBids) {
        if (ab.id !== lowestBidId && ab.status === 'pending') {
          await db.update(bids).set({ status: 'rejected' }).where(eq(bids.id, ab.id));
        }
      }
      await db.update(auctions).set({ winningBidId: lowestBidId }).where(eq(auctions.id, auction.id));

      const finalCents = Math.round((auction.maxBudget + lowestAmount) / 2);
      const feeCents = Math.round(finalCents * 0.06);
      const [acceptedBid] = await db.select().from(bids).where(eq(bids.id, lowestBidId));
      const isPaid = ['in_progress', 'completed'].includes(auction.status);

      const [payment] = await db.insert(payments).values({
        auctionId: auction.id, bidId: lowestBidId,
        clientUserId: auction.userId, professionalUserId: acceptedBid.professionalId,
        originalAmountCents: auction.maxBudget, winningBidAmountCents: lowestAmount,
        finalAmountCents: finalCents, platformFeeCents: feeCents, platformFeePercent: 6,
        status: isPaid ? 'paid' : 'pending',
        ...(isPaid ? { paidAt: new Date() } : {}),
      }).returning();
      paymentCount++;

      if (isPaid) {
        const [client] = await db.select().from(users).where(eq(users.id, auction.userId));
        const [pro] = await db.select().from(users).where(eq(users.id, acceptedBid.professionalId));
        const [proProfile] = await db.select().from(professionals).where(eq(professionals.userId, acceptedBid.professionalId));

        await db.insert(contracts).values({
          auctionId: auction.id, paymentId: payment.id,
          clientUserId: auction.userId, professionalUserId: acceptedBid.professionalId,
          clientContactInfo: { name: `${client.firstName} ${client.lastName}`, email: client.email, phone: client.phone || '' },
          professionalContactInfo: { name: `${pro.firstName} ${pro.lastName}`, email: pro.email, businessName: proProfile?.businessName || '', phone: pro.phone || '' },
          contractStatus: auction.status === 'completed' ? 'completed' : 'active',
          ...(auction.status === 'completed' ? { workCompletedDate: new Date() } : {}),
        });
        contractCount++;

        if (auction.status === 'completed') {
          const rating = Math.floor(3 + Math.random() * 3);
          const comments = ['Ottimo lavoro, professionista serio e puntuale.', 'Lavoro fatto bene, prezzo giusto.', 'Molto soddisfatto, super preciso.', 'Bravo, tempi rispettati.', 'Eccellente! Superato le aspettative.', 'Competente, lo richiamero sicuramente.'];
          await db.insert(reviews).values({
            auctionId: auction.id, professionalId: acceptedBid.professionalId,
            clientUserId: auction.userId, rating, comment: comments[Math.floor(Math.random() * comments.length)],
          });
          reviewCount++;
        }
      }
    }
  }

  console.log(`  ✓ ${bidCount} offerte (solo da pro della categoria giusta)`);
  console.log(`  ✓ ${paymentCount} pagamenti, ${contractCount} contratti, ${reviewCount} recensioni`);

  const [s] = await db.select({
    totalUsers: sql<number>`(SELECT count(*)::int FROM users)`,
    totalPros: sql<number>`(SELECT count(*)::int FROM professionals)`,
    totalAuctions: sql<number>`(SELECT count(*)::int FROM auctions)`,
    totalBids: sql<number>`(SELECT count(*)::int FROM bids)`,
    revenue: sql<number>`COALESCE((SELECT sum(platform_fee_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    volume: sql<number>`COALESCE((SELECT sum(final_amount_cents)::int FROM payments WHERE status = 'paid'), 0)`,
  }).from(sql`(SELECT 1) AS dummy`);

  console.log(`\n📊 Riepilogo:`);
  console.log(`   Utenti: ${s?.totalUsers} | Pro: ${s?.totalPros} | Aste: ${s?.totalAuctions} | Offerte: ${s?.totalBids}`);
  console.log(`   Volume: €${((s?.volume || 0) / 100).toLocaleString('it-IT')} | Revenue: €${((s?.revenue || 0) / 100).toLocaleString('it-IT')}`);
  console.log(`\n✅ Seed completato!`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
