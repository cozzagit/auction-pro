import { db } from '@/lib/db';
import { users, professionals, auctions, bids } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/pricing';

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-purple-100 text-purple-700' },
  professional: { label: 'Professionista', cls: 'bg-blue-100 text-blue-700' },
  customer: { label: 'Cliente', cls: 'bg-gray-100 text-gray-600' },
};

export default async function AdminUsersPage() {
  const allUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      city: users.city,
      province: users.province,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
      auctionCount: sql<number>`(SELECT count(*)::int FROM auctions WHERE user_id = ${users.id})`,
      bidCount: sql<number>`(SELECT count(*)::int FROM bids WHERE professional_id = ${users.id})`,
      totalSpent: sql<number>`COALESCE((SELECT sum(final_amount_cents)::int FROM payments WHERE client_user_id = ${users.id} AND status = 'paid'), 0)`,
      totalEarned: sql<number>`COALESCE((SELECT sum(final_amount_cents - platform_fee_cents)::int FROM payments WHERE professional_user_id = ${users.id} AND status = 'paid'), 0)`,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  // Stats
  const byRole: Record<string, number> = {};
  const activeCount = allUsers.filter(u => u.isActive).length;
  for (const u of allUsers) byRole[u.role] = (byRole[u.role] || 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Gestione Utenti ({allUsers.length})</h1>
        <div className="text-sm text-[var(--muted)]">{activeCount} attivi</div>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(byRole).map(([role, count]) => {
          const badge = ROLE_BADGE[role] || ROLE_BADGE.customer;
          return (
            <div key={role} className="card p-3 flex items-center gap-3">
              <span className={`badge px-2 py-1 ${badge.cls}`}>{badge.label}</span>
              <span className="text-lg font-extrabold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--border-light)] text-left">
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Utente</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Contatto</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] hidden md:table-cell">Zona</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Ruolo</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-center">Attivita</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right hidden lg:table-cell">Volume</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)]">Stato</th>
                <th className="px-4 py-3 font-semibold text-[var(--muted)] hidden lg:table-cell">Iscritto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {allUsers.map(u => {
                const roleBadge = ROLE_BADGE[u.role] || ROLE_BADGE.customer;
                const activity = u.role === 'professional' ? `${u.bidCount} offerte` : `${u.auctionCount} aste`;
                const volume = u.role === 'professional' ? u.totalEarned : u.totalSpent;
                return (
                  <tr key={u.id} className={`hover:bg-[var(--border-light)]/50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                          {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{u.firstName} {u.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{u.email}</div>
                      {u.phone && <div className="text-[10px] text-[var(--muted)]">{u.phone}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--muted)]">
                      {[u.city, u.province].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${roleBadge.cls}`}>{roleBadge.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium">{activity}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {volume > 0 ? (
                        <span className="font-mono text-xs font-medium text-[var(--success)]">{formatCurrency(volume)}</span>
                      ) : (
                        <span className="text-[var(--muted)] text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--muted)]">
                      {new Date(u.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
