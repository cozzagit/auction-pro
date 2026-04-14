import { db } from '@/lib/db';
import { users, auctions, professionals, payments, bids } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/pricing';

export default async function AdminDashboardPage() {
  const [stats] = await db.select({
    totalUsers: sql<number>`(SELECT count(*)::int FROM users)`,
    totalPros: sql<number>`(SELECT count(*)::int FROM professionals)`,
    pendingPros: sql<number>`(SELECT count(*)::int FROM professionals WHERE status = 'pending')`,
    totalAuctions: sql<number>`(SELECT count(*)::int FROM auctions)`,
    activeAuctions: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'active')`,
    totalBids: sql<number>`(SELECT count(*)::int FROM bids)`,
    totalRevenue: sql<number>`COALESCE((SELECT sum(platform_fee_cents)::int FROM payments WHERE status = 'paid'), 0)`,
  }).from(sql`(SELECT 1) AS dummy`);

  const recentAuctions = await db
    .select()
    .from(auctions)
    .orderBy(desc(auctions.createdAt))
    .limit(5);

  const pendingProfessionals = await db
    .select({ pro: professionals, userName: users.firstName, userLastName: users.lastName, userEmail: users.email })
    .from(professionals)
    .innerJoin(users, eq(professionals.userId, users.id))
    .where(eq(professionals.status, 'pending'))
    .limit(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Admin Dashboard ⚙️</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--primary)]">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Utenti totali</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--accent)]">{stats?.totalAuctions || 0}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Aste ({stats?.activeAuctions || 0} attive)</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--success)]">{stats?.totalPros || 0}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Professionisti</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-extrabold text-[var(--foreground)]">{formatCurrency(stats?.totalRevenue || 0)}</div>
          <div className="text-sm text-[var(--muted)] mt-1">Revenue piattaforma</div>
        </div>
      </div>

      {/* Pending professionals alert */}
      {pendingProfessionals.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--foreground)]">
              ⚠️ {pendingProfessionals.length} professionisti in attesa
            </h2>
            <Link href="/admin/professionisti" className="btn btn-primary text-xs px-3 py-1.5">
              Gestisci
            </Link>
          </div>
          <div className="space-y-2">
            {pendingProfessionals.slice(0, 3).map(p => (
              <div key={p.pro.id} className="flex items-center justify-between p-3 rounded-xl bg-white">
                <div>
                  <div className="font-semibold text-sm">{p.pro.businessName}</div>
                  <div className="text-xs text-[var(--muted)]">{p.userName} {p.userLastName} — {p.userEmail}</div>
                </div>
                <span className="badge bg-amber-100 text-amber-700">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/professionisti" className="card p-4 text-center hover:border-[var(--primary)]/30">
          <div className="text-2xl mb-2">👷</div>
          <div className="text-sm font-semibold">Professionisti</div>
        </Link>
        <Link href="/admin/aste" className="card p-4 text-center hover:border-[var(--primary)]/30">
          <div className="text-2xl mb-2">📋</div>
          <div className="text-sm font-semibold">Aste</div>
        </Link>
        <Link href="/admin/categorie" className="card p-4 text-center hover:border-[var(--primary)]/30">
          <div className="text-2xl mb-2">📂</div>
          <div className="text-sm font-semibold">Categorie</div>
        </Link>
        <Link href="/admin/utenti" className="card p-4 text-center hover:border-[var(--primary)]/30">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-sm font-semibold">Utenti</div>
        </Link>
      </div>

      {/* Recent auctions */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Ultime aste</h2>
        <div className="space-y-2">
          {recentAuctions.map(a => (
            <div key={a.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{a.title}</div>
                <div className="text-xs text-[var(--muted)]">{a.city} — {formatCurrency(a.maxBudget)}</div>
              </div>
              <span className={`badge ${a.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
