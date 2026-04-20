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
  const { auctions, auctionServices, services, categories } = await import('../src/lib/db/schema');
  const { eq, sql } = await import('drizzle-orm');

  console.log('🖼️  Seeding placeholder photos on auctions...\n');

  // Category → Unsplash photo URLs (free public, no attribution needed for direct links via source.unsplash.com)
  const PHOTOS_BY_CAT: Record<string, string[]> = {
    elettricista: [
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565608438257-fac3c27beb36?w=800&h=600&fit=crop',
    ],
    idraulica: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&h=600&fit=crop',
    ],
    giardinaggio: [
      'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop',
    ],
    pulizie: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600&fit=crop',
    ],
    ristrutturazioni: [
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=800&h=600&fit=crop',
    ],
    climatizzazione: [
      'https://images.unsplash.com/photo-1631545308456-38f03dd539c3?w=800&h=600&fit=crop',
    ],
    traslochi: [
      'https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600518464441-9306a36e2b8f?w=800&h=600&fit=crop',
    ],
    sicurezza: [
      'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop',
    ],
    fitness: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
    ],
    informatica: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop',
    ],
    fotografia: [
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop',
    ],
    babysitter: [
      'https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=800&h=600&fit=crop',
    ],
    benessere: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
    ],
    catering: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    ],
    consulenze: [
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
    ],
  };

  const allAuctions = await db.select({
    id: auctions.id,
    photos: auctions.photos,
  }).from(auctions);

  let updated = 0;

  for (const a of allAuctions) {
    // Skip if already has photos
    if ((a.photos as string[])?.length > 0) continue;

    // ~60% of auctions get placeholder photos
    if (Math.random() > 0.6) continue;

    // Get auction category
    const [svc] = await db
      .select({ catSlug: categories.slug })
      .from(auctionServices)
      .innerJoin(services, eq(auctionServices.serviceId, services.id))
      .innerJoin(categories, eq(services.categoryId, categories.id))
      .where(eq(auctionServices.auctionId, a.id))
      .limit(1);

    if (!svc) continue;
    const availablePhotos = PHOTOS_BY_CAT[svc.catSlug];
    if (!availablePhotos || availablePhotos.length === 0) continue;

    // Pick 1-3 random photos
    const count = 1 + Math.floor(Math.random() * Math.min(3, availablePhotos.length));
    const shuffled = [...availablePhotos].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    await db.update(auctions).set({ photos: selected }).where(eq(auctions.id, a.id));
    updated++;
  }

  // Also add placeholder documents to ~20% of auctions
  let docsAdded = 0;
  const FAKE_DOCS = [
    { name: 'Planimetria appartamento.pdf', url: '/uploads/documents/placeholder-planimetria.pdf', size: 234567 },
    { name: 'Preventivo precedente.pdf', url: '/uploads/documents/placeholder-preventivo.pdf', size: 156789 },
    { name: 'Foto aggiuntive dettagli.pdf', url: '/uploads/documents/placeholder-dettagli.pdf', size: 345678 },
    { name: 'Specifiche tecniche.pdf', url: '/uploads/documents/placeholder-specifiche.pdf', size: 198765 },
  ];

  for (const a of allAuctions) {
    if (Math.random() > 0.2) continue;
    const count = 1 + Math.floor(Math.random() * 2);
    const docs = [...FAKE_DOCS].sort(() => Math.random() - 0.5).slice(0, count);
    await db.update(auctions).set({ documents: docs }).where(eq(auctions.id, a.id));
    docsAdded++;
  }

  const [s] = await db.select({
    withPhotos: sql<number>`(SELECT count(*)::int FROM auctions WHERE jsonb_array_length(photos) > 0)`,
    withDocs: sql<number>`(SELECT count(*)::int FROM auctions WHERE jsonb_array_length(documents) > 0)`,
  }).from(sql`(SELECT 1) AS dummy`);

  console.log(`\n✅ Done:`);
  console.log(`   Aste con foto: ${s?.withPhotos} (aggiunte ${updated})`);
  console.log(`   Aste con documenti: ${s?.withDocs} (aggiunte ${docsAdded})`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
