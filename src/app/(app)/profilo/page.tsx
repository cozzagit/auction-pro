'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', city: '', province: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(data => {
      if (data?.user) {
        setForm(f => ({ ...f, email: data.user.email || '', firstName: data.user.name?.split(' ')[0] || '', lastName: data.user.name?.split(' ').slice(1).join(' ') || '' }));
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    // TODO: implement profile update API
    setTimeout(() => {
      setMessage('Profilo aggiornato');
      setSaving(false);
    }, 500);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Il tuo profilo</h1>

      {message && <div className="p-3 rounded-xl bg-[var(--success-light)] text-[var(--success)] text-sm font-medium">{message}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome</label>
            <input type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Cognome</label>
            <input type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" value={form.email} disabled className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm bg-[var(--border-light)] text-[var(--muted)]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Telefono</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+39 xxx xxx xxxx" className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Citta</label>
            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Provincia</label>
            <input type="text" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} maxLength={3} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] outline-none" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary w-full py-3 disabled:opacity-50">
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </form>
    </div>
  );
}
