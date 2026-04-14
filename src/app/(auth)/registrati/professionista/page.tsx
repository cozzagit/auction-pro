'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfessionalRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    businessName: '', vatNumber: '', phone: '', city: '', province: '', zipCode: '',
    description: '', experience: '', hasInsurance: false, hasLicense: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create user account
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: 'professional',
        }),
      });

      if (!regRes.ok) {
        const data = await regRes.json();
        setError(data.error?.message || 'Errore registrazione');
        setLoading(false);
        return;
      }

      // 2. Login
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });

      // 3. Create professional profile
      const proRes = await fetch('/api/professional/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          vatNumber: form.vatNumber,
          phone: form.phone,
          city: form.city,
          province: form.province,
          zipCode: form.zipCode,
          description: form.description,
          experience: form.experience,
          hasInsurance: form.hasInsurance,
          hasLicense: form.hasLicense,
        }),
      });

      if (!proRes.ok) {
        const data = await proRes.json();
        setError(data.error?.message || 'Errore profilo');
        setLoading(false);
        return;
      }

      router.push('/pro/dashboard');
      router.refresh();
    } catch {
      setError('Errore di connessione');
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 max-w-lg w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold">Diventa professionista 🔧</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Registrati e inizia a ricevere richieste di lavoro</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} required className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cognome *</label>
                <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} required className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn btn-primary w-full py-3">Avanti — Dati azienda</button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Nome azienda / attivita *</label>
              <input type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)} required className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Partita IVA *</label>
              <input type="text" value={form.vatNumber} onChange={e => update('vatNumber', e.target.value)} required className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" placeholder="IT12345678901" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Citta</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provincia</label>
                <input type="text" value={form.province} onChange={e => update('province', e.target.value)} maxLength={3} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefono</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrizione attivita</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm focus:border-[var(--primary)] outline-none resize-none" placeholder="Descrivi la tua attivita e i servizi che offri..." />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hasInsurance} onChange={e => update('hasInsurance', e.target.checked)} className="rounded" />
                <span className="text-sm">Ho assicurazione RC</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hasLicense} onChange={e => update('hasLicense', e.target.checked)} className="rounded" />
                <span className="text-sm">Ho abilitazione</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex-1 py-3">← Indietro</button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-3 disabled:opacity-50">
                {loading ? 'Registrazione...' : '🚀 Completa registrazione'}
              </button>
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-[var(--muted)] mt-6">
        <Link href="/registrati" className="text-[var(--primary)] font-semibold hover:underline">Registrati come cliente</Link>
        {' · '}
        <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">Accedi</Link>
      </p>
    </div>
  );
}
