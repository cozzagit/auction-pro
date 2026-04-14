'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/pricing';

interface User {
  id: string; firstName: string; lastName: string; email: string;
  role: string; city: string | null; province: string | null; phone: string | null;
  isActive: boolean; createdAt: string; auctionCount: number; bidCount: number;
  totalSpent: number; totalEarned: number;
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-purple-100 text-purple-700' },
  professional: { label: 'Pro', cls: 'bg-blue-100 text-blue-700' },
  customer: { label: 'Cliente', cls: 'bg-gray-100 text-gray-600' },
};

export function UserTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function toggleActive(userId: string, currentActive: boolean) {
    if (!confirm(`${currentActive ? 'Disattivare' : 'Riattivare'} questo utente?`)) return;
    setActionLoading(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    setActionLoading(null);
    router.refresh();
  }

  async function changeRole(userId: string, newRole: string) {
    if (!confirm(`Cambiare il ruolo a "${newRole}"?`)) return;
    setActionLoading(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setActionLoading(null);
    router.refresh();
  }

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q) || u.phone?.includes(q);
    }
    return true;
  });

  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome, email, citta, telefono..."
          className="flex-1 min-w-[250px] rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
        />
        <div className="flex gap-1.5">
          {[{ value: '', label: 'Tutti' }, { value: 'customer', label: 'Clienti' }, { value: 'professional', label: 'Pro' }, { value: 'admin', label: 'Admin' }].map(f => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                roleFilter === f.value ? 'bg-[var(--primary)] text-white' : 'bg-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--border)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-[var(--muted)]">{filtered.length} risultati</div>
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
                <th className="px-4 py-3 font-semibold text-[var(--muted)] text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filtered.map(u => {
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
                        <div className="font-medium">{u.firstName} {u.lastName}</div>
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
                        {u.isActive ? 'Attivo' : 'Off'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--muted)]">
                      {new Date(u.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleActive(u.id, u.isActive)}
                          disabled={actionLoading === u.id}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all disabled:opacity-50 ${
                            u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Disattiva' : 'Riattiva'}
                        </button>
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          disabled={actionLoading === u.id}
                          className="px-1.5 py-1 rounded-lg text-[10px] border border-[var(--border)] bg-white disabled:opacity-50"
                        >
                          <option value="customer">Cliente</option>
                          <option value="professional">Pro</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
