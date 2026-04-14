import { db } from '@/lib/db';
import { categories, services } from '@/lib/db/schema';
import { asc, sql } from 'drizzle-orm';
import Link from 'next/link';

export default async function CategoriesPage() {
  const allCategories = await db
    .select({
      category: categories,
      serviceCount: sql<number>`(SELECT count(*)::int FROM services WHERE category_id = ${categories.id})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)]">Tutte le categorie</h1>
        <p className="text-[var(--muted)] mt-2">26 categorie di servizi professionali a tua disposizione</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {allCategories.map(c => (
          <div key={c.category.id} className="card p-5 text-center hover:scale-[1.02] transition-transform cursor-pointer group">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-3 group-hover:scale-110 transition-transform"
              style={{ background: `${c.category.color}15` }}
            >
              {c.category.icon}
            </div>
            <h3 className="font-bold text-sm text-[var(--foreground)]">{c.category.name}</h3>
            <p className="text-xs text-[var(--muted)] mt-1">{c.category.description}</p>
            {c.serviceCount > 0 && (
              <div className="text-[11px] text-[var(--primary)] font-medium mt-2">{c.serviceCount} servizi</div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/registrati" className="btn btn-primary">Inizia gratis — Pubblica un&apos;asta</Link>
      </div>
    </div>
  );
}
