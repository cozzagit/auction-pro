import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) process.env[t.substring(0, i)] = t.substring(i + 1);
  }
} catch { /* ignore */ }

async function main() {
  const { db } = await import('../src/lib/db');
  const { categories, services, serviceParameters } = await import('../src/lib/db/schema');

  console.log('Seeding categories...');

  const CATEGORIES = [
    { name: 'Elettricista', slug: 'elettricista', icon: '⚡', description: 'Installazione e riparazione impianti elettrici', color: '#EAB308', sortOrder: 1 },
    { name: 'Idraulica', slug: 'idraulica', icon: '🔧', description: 'Servizi idraulici e riparazioni', color: '#3B82F6', sortOrder: 2 },
    { name: 'Giardinaggio', slug: 'giardinaggio', icon: '🌿', description: 'Cura e manutenzione del giardino', color: '#10B981', sortOrder: 3 },
    { name: 'Pulizie', slug: 'pulizie', icon: '✨', description: 'Servizi di pulizia per casa e ufficio', color: '#8B5CF6', sortOrder: 4 },
    { name: 'Ristrutturazioni', slug: 'ristrutturazioni', icon: '🏗️', description: 'Lavori di ristrutturazione e rimodernamento', color: '#F97316', sortOrder: 5 },
    { name: 'Traslochi', slug: 'traslochi', icon: '📦', description: 'Servizi di trasloco e facchinaggio', color: '#6366F1', sortOrder: 6 },
    { name: 'Sicurezza', slug: 'sicurezza', icon: '🛡️', description: 'Sistemi di allarme e videosorveglianza', color: '#1D4ED8', sortOrder: 7 },
    { name: 'Climatizzazione', slug: 'climatizzazione', icon: '❄️', description: 'Installazione e manutenzione climatizzatori', color: '#06B6D4', sortOrder: 8 },
    { name: 'Anziani', slug: 'anziani', icon: '❤️', description: 'Servizi di assistenza e cura per anziani', color: '#EC4899', sortOrder: 9 },
    { name: 'Babysitter', slug: 'babysitter', icon: '👶', description: 'Servizi di babysitting e cura bambini', color: '#F472B6', sortOrder: 10 },
    { name: 'Pet Sitting', slug: 'pet-sitting', icon: '🐕', description: 'Cura e assistenza animali domestici', color: '#A855F7', sortOrder: 11 },
    { name: 'Domestici', slug: 'domestici', icon: '🏠', description: 'Colf, badanti e assistenza domestica', color: '#78716C', sortOrder: 12 },
    { name: 'Fitness', slug: 'fitness', icon: '💪', description: 'Personal trainer, istruttori sportivi', color: '#EF4444', sortOrder: 13 },
    { name: 'Benessere', slug: 'benessere', icon: '🧘', description: 'Massaggi, estetica, trattamenti benessere', color: '#D946EF', sortOrder: 14 },
    { name: 'Sanitari', slug: 'sanitari', icon: '🩺', description: 'Infermieri, fisioterapisti, servizi medici', color: '#14B8A6', sortOrder: 15 },
    { name: 'Ripetizioni', slug: 'ripetizioni', icon: '📚', description: 'Lezioni private e ripetizioni scolastiche', color: '#0EA5E9', sortOrder: 16 },
    { name: 'Corsi Privati', slug: 'corsi-privati', icon: '🎵', description: 'Corsi di musica, lingue, arte', color: '#7C3AED', sortOrder: 17 },
    { name: 'Informatica', slug: 'informatica', icon: '💻', description: 'Supporto tecnico e riparazione dispositivi', color: '#475569', sortOrder: 18 },
    { name: 'Consulenze', slug: 'consulenze', icon: '💼', description: 'Consulenze legali, fiscali, amministrative', color: '#0F766E', sortOrder: 19 },
    { name: 'Fotografia', slug: 'fotografia', icon: '📷', description: 'Servizi fotografici per eventi e cerimonie', color: '#B45309', sortOrder: 20 },
    { name: 'Catering', slug: 'catering', icon: '🍽️', description: 'Servizi di catering e ristorazione', color: '#DC2626', sortOrder: 21 },
    { name: 'Wedding', slug: 'wedding', icon: '💒', description: 'Organizzazione matrimoni ed eventi', color: '#BE185D', sortOrder: 22 },
    { name: 'Auto', slug: 'auto', icon: '🚗', description: 'Riparazioni e manutenzione veicoli', color: '#4338CA', sortOrder: 23 },
    { name: 'Autista', slug: 'autista', icon: '🚕', description: 'Servizi di autista e accompagnamento', color: '#1E40AF', sortOrder: 24 },
    { name: 'Sartoria', slug: 'sartoria', icon: '✂️', description: 'Riparazioni vestiti, modifiche sartoriali', color: '#9333EA', sortOrder: 25 },
    { name: 'Lavanderia', slug: 'lavanderia', icon: '👔', description: 'Servizi di lavanderia e stiratura', color: '#0891B2', sortOrder: 26 },
  ];

  for (const cat of CATEGORIES) {
    const [inserted] = await db.insert(categories).values(cat).onConflictDoNothing().returning();
    if (inserted) {
      console.log(`  ✓ ${cat.icon} ${cat.name}`);
    } else {
      console.log(`  - ${cat.name} (gia esistente)`);
    }
  }

  // Seed some services for key categories
  const catRows = await db.select().from(categories);
  const catMap = new Map(catRows.map(c => [c.slug, c.id]));

  const SERVICES: Array<{ categorySlug: string; name: string; slug: string; description: string }> = [
    // Elettricista
    { categorySlug: 'elettricista', name: 'Installazione prese e interruttori', slug: 'prese-interruttori', description: 'Installazione o sostituzione prese, interruttori e punti luce' },
    { categorySlug: 'elettricista', name: 'Installazione lampadario', slug: 'lampadario', description: 'Montaggio e collegamento lampadari e plafoniere' },
    { categorySlug: 'elettricista', name: 'Quadro elettrico', slug: 'quadro-elettrico', description: 'Installazione o aggiornamento quadro elettrico' },
    { categorySlug: 'elettricista', name: 'Illuminazione esterna', slug: 'illuminazione-esterna', description: 'Installazione luci da giardino, terrazza, balcone' },
    // Idraulica
    { categorySlug: 'idraulica', name: 'Riparazione perdite', slug: 'riparazione-perdite', description: 'Ricerca e riparazione perdite acqua' },
    { categorySlug: 'idraulica', name: 'Installazione sanitari', slug: 'installazione-sanitari', description: 'Montaggio WC, bidet, lavabo, doccia' },
    { categorySlug: 'idraulica', name: 'Sostituzione rubinetteria', slug: 'rubinetteria', description: 'Sostituzione rubinetti bagno e cucina' },
    { categorySlug: 'idraulica', name: 'Scaldasalviette', slug: 'scaldasalviette', description: 'Installazione scaldasalviette elettrico o idraulico' },
    // Giardinaggio
    { categorySlug: 'giardinaggio', name: 'Taglio erba', slug: 'taglio-erba', description: 'Taglio e manutenzione prato' },
    { categorySlug: 'giardinaggio', name: 'Potatura siepi', slug: 'potatura-siepi', description: 'Potatura siepi e arbusti' },
    { categorySlug: 'giardinaggio', name: 'Piantumazione', slug: 'piantumazione', description: 'Piantumazione fiori, piante, alberi' },
    { categorySlug: 'giardinaggio', name: 'Impianto irrigazione', slug: 'irrigazione', description: 'Installazione sistema di irrigazione' },
    { categorySlug: 'giardinaggio', name: 'Progettazione giardino', slug: 'progettazione-giardino', description: 'Progettazione completa aree verdi' },
    // Pulizie
    { categorySlug: 'pulizie', name: 'Pulizia appartamento', slug: 'pulizia-appartamento', description: 'Pulizia completa di appartamento' },
    { categorySlug: 'pulizie', name: 'Pulizia ufficio', slug: 'pulizia-ufficio', description: 'Pulizia uffici e spazi commerciali' },
    { categorySlug: 'pulizie', name: 'Pulizia post cantiere', slug: 'pulizia-cantiere', description: 'Pulizia dopo lavori di ristrutturazione' },
    // Fitness
    { categorySlug: 'fitness', name: 'Personal trainer', slug: 'personal-trainer', description: 'Sessioni personalizzate con trainer certificato' },
    { categorySlug: 'fitness', name: 'Yoga privato', slug: 'yoga', description: 'Lezioni private di yoga a domicilio' },
    // Informatica
    { categorySlug: 'informatica', name: 'Riparazione PC', slug: 'riparazione-pc', description: 'Diagnosi e riparazione computer' },
    { categorySlug: 'informatica', name: 'Configurazione rete', slug: 'configurazione-rete', description: 'Setup WiFi, NAS, rete domestica' },
    { categorySlug: 'informatica', name: 'Recupero dati', slug: 'recupero-dati', description: 'Recupero dati da dispositivi danneggiati' },
  ];

  for (const svc of SERVICES) {
    const catId = catMap.get(svc.categorySlug);
    if (!catId) continue;
    await db.insert(services).values({
      categoryId: catId,
      name: svc.name,
      slug: svc.slug,
      description: svc.description,
    }).onConflictDoNothing();
  }

  console.log(`\nSeeded ${CATEGORIES.length} categories and ${SERVICES.length} services`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
