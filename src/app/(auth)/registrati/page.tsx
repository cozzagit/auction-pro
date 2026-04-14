'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Errore nella registrazione');
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Errore di connessione');
      setLoading(false);
    }
  }

  return (
    <div className="card p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Crea il tuo account</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Inizia a risparmiare su ogni servizio</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Role selector */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => update('role', 'customer')}
          className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
            form.role === 'customer'
              ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)]'
              : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted-light)]'
          }`}
        >
          <div className="text-xl mb-1">🏠</div>
          <div className="text-sm font-semibold">Cerco servizi</div>
          <div className="text-[11px] opacity-70">Pubblica aste</div>
        </button>
        <button
          type="button"
          onClick={() => update('role', 'professional')}
          className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
            form.role === 'professional'
              ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)]'
              : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted-light)]'
          }`}
        >
          <div className="text-xl mb-1">🔧</div>
          <div className="text-sm font-semibold">Sono professionista</div>
          <div className="text-[11px] opacity-70">Offri servizi</div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Nome</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
              placeholder="Mario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Cognome</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
              placeholder="Rossi"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
            placeholder="mario@esempio.it"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
            placeholder="Minimo 8 caratteri"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {loading ? 'Registrazione...' : 'Crea account'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--muted)] mt-6">
        Hai gia un account?{' '}
        <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}
