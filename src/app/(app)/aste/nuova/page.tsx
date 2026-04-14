'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category { id: string; name: string; icon: string; color: string; slug: string; }
interface Service { id: string; name: string; categoryId: string; }

export default function CreateAuctionPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    maxBudget: '',
    city: '',
    province: '',
    daysToExpire: '7',
  });
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; serviceName: string; categoryName: string; parameters: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.data || []));
  }, []);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const budget = parseFloat(form.maxBudget.replace(',', '.'));
    if (isNaN(budget) || budget <= 0) {
      setError('Inserisci un budget valido');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          maxBudget: budget,
          city: form.city,
          province: form.province,
          expiresAt: new Date(Date.now() + parseInt(form.daysToExpire) * 24 * 60 * 60 * 1000).toISOString(),
          services: selectedServices.map(s => ({ serviceId: s.serviceId, parameters: s.parameters })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Errore');
        setLoading(false);
        return;
      }

      const { data } = await res.json();
      router.push(`/aste/${data.id}`);
    } catch {
      setError('Errore di connessione');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Crea una nuova asta</h1>
        <p className="text-[var(--muted)] mt-1">Descrivi il lavoro e i professionisti competeranno per offrirti il miglior prezzo</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map(s => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              step === s ? 'bg-[var(--primary)] text-white' : 'bg-[var(--border-light)] text-[var(--muted)]'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{s}</span>
            {s === 1 ? 'Dettagli' : 'Servizi'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Titolo *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                required
                minLength={5}
                placeholder="Es: Rifacimento impianto elettrico appartamento"
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Descrizione *</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                required
                minLength={20}
                rows={4}
                placeholder="Descrivi nel dettaglio il lavoro che ti serve..."
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Budget massimo (EUR) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.maxBudget}
                  onChange={e => update('maxBudget', e.target.value)}
                  required
                  placeholder="500"
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Durata asta</label>
                <select
                  value={form.daysToExpire}
                  onChange={e => update('daysToExpire', e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none bg-white"
                >
                  <option value="3">3 giorni</option>
                  <option value="5">5 giorni</option>
                  <option value="7">7 giorni</option>
                  <option value="14">14 giorni</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Citta</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="Milano"
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Provincia</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={e => update('province', e.target.value)}
                  placeholder="MI"
                  maxLength={3}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none"
                />
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn btn-primary w-full py-3">
              Avanti — Seleziona servizi
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card p-6 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Seleziona le categorie di servizi che ti servono. I professionisti vedranno queste informazioni.
            </p>

            {/* Category grid for selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => {
                const isSelected = selectedServices.some(s => s.categoryName === cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedServices(ss => ss.filter(s => s.categoryName !== cat.name));
                      } else {
                        setSelectedServices(ss => [...ss, { serviceId: cat.id, serviceName: cat.name, categoryName: cat.name, parameters: {} }]);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)]'
                        : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted-light)]'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.icon || '🔧'}</div>
                    <div className="text-xs font-semibold">{cat.name}</div>
                  </button>
                );
              })}
            </div>

            {selectedServices.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-50 text-sm text-[var(--primary)]">
                {selectedServices.length} {selectedServices.length === 1 ? 'categoria selezionata' : 'categorie selezionate'}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex-1 py-3">
                ← Indietro
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-3 disabled:opacity-50">
                {loading ? 'Pubblicazione...' : '🚀 Pubblica asta'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
