import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/pricing';
import { UserTable } from './user-table';

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
    .limit(500);

  const byRole: Record<string, number> = {};
  for (const u of allUsers) byRole[u.role] = (byRole[u.role] || 0) + 1;

  const serialized = allUsers.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Gestione Utenti ({allUsers.length})</h1>
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

      <UserTable users={serialized} />
    </div>
  );
}
