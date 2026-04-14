import { db } from '@/lib/db';
import { users, auctions, professionals, payments, bids, contracts, reviews } from '@/lib/db/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/pricing';

export default async function AdminDashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [stats] = await db.select({
    totalUsers: sql<number>`(SELECT count(*)::int FROM users)`,
    newUsersMonth: sql<number>`(SELECT count(*)::int FROM users WHERE created_at >= ${thirtyDaysAgo.toISOString()})`,
    totalPros: sql<number>`(SELECT count(*)::int FROM professionals)`,
    approvedPros: sql<number>`(SELECT count(*)::int FROM professionals WHERE status = 'approved')`,
    pendingPros: sql<number>`(SELECT count(*)::int FROM professionals WHERE status = 'pending')`,
    totalAuctions: sql<number>`(SELECT count(*)::int FROM auctions)`,
    activeAuctions: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'active')`,
    completedAuctions: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'completed')`,
    awardedAuctions: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'awarded' OR status = 'in_progress')`,
    expiredAuctions: sql<number>`(SELECT count(*)::int FROM auctions WHERE status = 'expired')`,
    auctionsThisWeek: sql<number>`(SELECT count(*)::int FROM auctions WHERE created_at >= ${sevenDaysAgo.toISOString()})`,
    totalBids: sql<number>`(SELECT count(*)::int FROM bids)`,
    totalPayments: sql<number>`(SELECT count(*)::int FROM payments)`,
    paidPayments: sql<number>`(SELECT count(*)::int FROM payments WHERE status = 'paid')`,
    totalRevenue: sql<number>`COALESCE((SELECT sum(platform_fee_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    totalVolume: sql<number>`COALESCE((SELECT sum(final_amount_cents)::int FROM payments WHERE status = 'paid'), 0)`,
    avgBidsPerAuction: sql<number>`COALESCE((SELECT round(avg(bid_count)::numeric, 1) FROM (SELECT count(*)::numeric as bid_count FROM bids GROUP BY auction_id) sub), 0)`,
    totalContracts: sql<number>`(SELECT count(*)::int FROM contracts)`,
    completedContracts: sql<number>`(SELECT count(*)::int FROM contracts WHERE contract_status = 'completed')`,
    totalReviews: sql<number>`(SELECT count(*)::int FROM reviews)`,
    avgRating: sql<number>`COALESCE((SELECT round(avg(rating)::numeric, 2) FROM reviews), 0)`,
    avgSavingsPercent: sql<number>`COALESCE((SELECT round(avg((original_amount_cents - final_amount_cents)::numeric / original_amount_cents * 100)::numeric, 1) FROM payments WHERE status = 'paid'), 0)`,
  }).from(sql`(SELECT 1) AS dummy`);

  const conversionRate = stats && stats.totalAuctions > 0
    ? Math.round(((stats.completedAuctions + stats.awardedAuctions) / stats.totalAuctions) * 100) : 0;

  // Recent auctions
  const recentAuctions = await db
    .select({
      id: auctions.id, title: auctions.title, maxBudget: auctions.maxBudget,
      city: auctions.city, status: auctions.status, createdAt: auctions.createdAt,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE auction_id = ${auctions.id})`,
    })
    .from(auctions).orderBy(desc(auctions.createdAt)).limit(8);

  // Top professionals by jobs
  const topPros = await db
    .select({ pro: professionals, userName: users.firstName, userLastName: users.lastName })
    .from(professionals)
    .innerJoin(users, eq(professionals.userId, users.id))
    .where(eq(professionals.status, 'approved'))
    .orderBy(desc(professionals.totalJobs))
    .limit(5);

  // Revenue by status
  const pendingRevenue = await db.select({
    total: sql<number>`COALESCE(sum(platform_fee_cents)::int, 0)`,
  }).from(payments).where(eq(payments.status, 'pending'));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Admin Dashboard</h1>
          <p className="text-[var(--muted)] mt-1">Panoramica completa della piattaforma Ribasta</p>
        </div>
        <div className="text-right text-xs text-[var(--muted)]">
          Aggiornato: {now.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Revenue Hero */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 md:col-span-1">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Revenue Piattaforma (6%)</div>
          <div className="text-3xl font-extrabold text-emerald-700">{formatCurrency(stats?.totalRevenue || 0)}</div>
          <div className="text-sm text-emerald-600 mt-1">{stats?.paidPayments || 0} transazioni completate</div>
          {(pendingRevenue[0]?.total || 0) > 0 && (
            <div className="text-xs text-amber-600 mt-2">+ {formatCurrency(pendingRevenue[0].total)} in attesa</div>
          )}
        </div>
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Volume Transato</div>
          <div className="text-3xl font-extrabold text-blue-700">{formatCurrency(stats?.totalVolume || 0)}</div>
          <div className="text-sm text-blue-600 mt-1">Risparmio medio clienti: {stats?.avgSavingsPercent || 0}%</div>
        </div>
        <div className="card p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Conversion Rate</div>
          <div className="text-3xl font-extrabold text-purple-700">{conversionRate}%</div>
          <div className="text-sm text-purple-600 mt-1">Aste → Lavori completati/assegnati</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard label="Utenti" value={stats?.totalUsers || 0} sub={`+${stats?.newUsersMonth || 0} questo mese`} color="blue" />
        <KpiCard label="Professionisti" value={stats?.approvedPros || 0} sub={`${stats?.pendingPros || 0} in attesa`} color="green" />
        <KpiCard label="Aste Totali" value={stats?.totalAuctions || 0} sub={`+${stats?.auctionsThisWeek || 0} questa settimana`} color="indigo" />
        <KpiCard label="Aste Attive" value={stats?.activeAuctions || 0} sub="aperte ora" color="amber" />
        <KpiCard label="Offerte Totali" value={stats?.totalBids || 0} sub={`media ${stats?.avgBidsPerAuction || 0}/asta`} color="orange" />
        <KpiCard label="Recensioni" value={stats?.totalReviews || 0} sub={`media ⭐ ${stats?.avgRating || 0}`} color="yellow" />
      </div>

      {/* Auction funnel */}
      <div className="card p-6">
        <h2 className="font-bold text-[var(--foreground)] mb-4">Funnel Aste</h2>
        <div className="grid grid-cols-5 gap-2">
          <FunnelStep label="Attive" count={stats?.activeAuctions || 0} color="bg-blue-500" total={stats?.totalAuctions || 1} />
          <FunnelStep label="Assegnate" count={stats?.awardedAuctions || 0} color="bg-amber-500" total={stats?.totalAuctions || 1} />
          <FunnelStep label="Completate" count={stats?.completedAuctions || 0} color="bg-emerald-500" total={stats?.totalAuctions || 1} />
          <FunnelStep label="Scadute" count={stats?.expiredAuctions || 0} color="bg-red-400" total={stats?.totalAuctions || 1} />
          <FunnelStep label="Contratti" count={stats?.completedContracts || 0} color="bg-purple-500" total={stats?.totalAuctions || 1} />
        </div>
      </div>

      {/* Pending pros alert */}
      {(stats?.pendingPros || 0) > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-amber-800">⚠️ {stats?.pendingPros} professionisti in attesa di approvazione</span>
              <p className="text-xs text-amber-600 mt-0.5">Approvandoli potranno iniziare a fare offerte sulle aste</p>
            </div>
            <Link href="/admin/professionisti" className="btn btn-primary text-xs px-4">Gestisci →</Link>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent auctions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--foreground)]">Ultime aste</h2>
            <Link href="/admin/aste" className="text-xs text-[var(--primary)] font-medium hover:underline">Vedi tutte →</Link>
          </div>
          <div className="space-y-2">
            {recentAuctions.map(a => (
              <Link key={a.id} href={`/admin/aste/${a.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--border-light)] transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{a.title}</div>
                  <div className="text-xs text-[var(--muted)]">{a.city} · {a.bidCount} offerte · {formatCurrency(a.maxBudget)}</div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Top professionals */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--foreground)]">Top Professionisti</h2>
            <Link href="/admin/professionisti" className="text-xs text-[var(--primary)] font-medium hover:underline">Vedi tutti →</Link>
          </div>
          <div className="space-y-2">
            {topPros.map((p, i) => (
              <div key={p.pro.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--border-light)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{p.pro.businessName}</div>
                    <div className="text-xs text-[var(--muted)]">{p.userName} {p.userLastName} · {p.pro.city}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">⭐ {p.pro.rating.toFixed(1)}</div>
                  <div className="text-xs text-[var(--muted)]">{p.pro.totalJobs} lavori</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <QuickLink href="/admin/professionisti" icon="👷" label="Professionisti" count={stats?.totalPros || 0} />
        <QuickLink href="/admin/aste" icon="📋" label="Aste" count={stats?.totalAuctions || 0} />
        <QuickLink href="/admin/categorie" icon="📂" label="Categorie" count={26} />
        <QuickLink href="/admin/utenti" icon="👥" label="Utenti" count={stats?.totalUsers || 0} />
        <QuickLink href="/admin/pagamenti" icon="💰" label="Pagamenti" count={stats?.totalPayments || 0} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-700', green: 'text-emerald-700', indigo: 'text-indigo-700',
    amber: 'text-amber-700', orange: 'text-orange-700', yellow: 'text-yellow-700',
  };
  return (
    <div className="card p-4">
      <div className={`text-2xl font-extrabold tabular-nums ${colors[color] || 'text-gray-900'}`}>{value.toLocaleString('it-IT')}</div>
      <div className="text-xs font-medium text-[var(--foreground)] mt-0.5">{label}</div>
      <div className="text-[10px] text-[var(--muted)] mt-0.5">{sub}</div>
    </div>
  );
}

function FunnelStep({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="text-center">
      <div className="text-lg font-extrabold">{count}</div>
      <div className="text-[10px] text-[var(--muted)] mb-1">{label}</div>
      <div className="h-2 rounded-full bg-[var(--border-light)] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-[var(--muted)] mt-0.5">{pct}%</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Attiva', cls: 'bg-blue-100 text-blue-700' },
    expired: { label: 'Scaduta', cls: 'bg-red-100 text-red-700' },
    awarded: { label: 'Assegnata', cls: 'bg-amber-100 text-amber-700' },
    in_progress: { label: 'In corso', cls: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Completata', cls: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Annullata', cls: 'bg-gray-100 text-gray-600' },
  };
  const s = map[status] || map.active;
  return <span className={`badge shrink-0 text-[10px] ${s.cls}`}>{s.label}</span>;
}

function QuickLink({ href, icon, label, count }: { href: string; icon: string; label: string; count: number }) {
  return (
    <Link href={href} className="card p-4 text-center hover:border-[var(--primary)]/30 hover:scale-[1.02] transition-all">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-sm font-bold">{label}</div>
      <div className="text-xs text-[var(--muted)]">{count}</div>
    </Link>
  );
}
