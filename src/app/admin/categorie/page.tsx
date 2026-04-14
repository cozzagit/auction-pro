import { db } from '@/lib/db';
import { categories, services } from '@/lib/db/schema';
import { asc, eq, sql } from 'drizzle-orm';

export default async function AdminCategoriesPage() {
  const allCategories = await db
    .select({
      category: categories,
      serviceCount: sql<number>`(SELECT count(*)::int FROM services WHERE category_id = ${categories.id})`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Gestione Categorie ({allCategories.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {allCategories.map(c => (
          <div key={c.category.id} className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{c.category.icon}</span>
              <div>
                <div className="font-bold text-sm">{c.category.name}</div>
                <div className="text-xs text-[var(--muted)]">{c.serviceCount} servizi</div>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">{c.category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
