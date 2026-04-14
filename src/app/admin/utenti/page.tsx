import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Gestione Utenti ({allUsers.length})</h1>
      <div className="space-y-2">
        {allUsers.map(u => (
          <div key={u.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-sm text-[var(--primary)]">
                {u.firstName.charAt(0)}{u.lastName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm">{u.firstName} {u.lastName}</div>
                <div className="text-xs text-[var(--muted)]">{u.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'professional' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {u.role === 'admin' ? 'Admin' : u.role === 'professional' ? 'Professionista' : 'Cliente'}
              </span>
              <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {u.isActive ? 'Attivo' : 'Disattivato'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
