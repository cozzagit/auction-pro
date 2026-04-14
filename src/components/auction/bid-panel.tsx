'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/pricing';

interface Props {
  auctionId: string;
  maxBudget: number;
}

export function BidPanel({ auctionId, maxBudget }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Inserisci un importo valido');
      return;
    }
    if (parsed * 100 >= maxBudget) {
      setError('L\'offerta deve essere inferiore al budget');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Errore');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Errore di connessione');
      setLoading(false);
    }
  }

  const savings = amount ? Math.max(0, maxBudget / 100 - parseFloat(amount.replace(',', '.') || '0')) : 0;

  return (
    <div className="card p-5">
      <h3 className="font-bold text-[var(--foreground)] mb-1">Fai la tua offerta</h3>
      <p className="text-xs text-[var(--muted)] mb-4">
        Budget massimo: <strong>{formatCurrency(maxBudget)}</strong>
      </p>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            La tua offerta (EUR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] font-medium">€</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
              className="w-full rounded-xl border border-[var(--border)] pl-8 pr-4 py-3 text-lg font-bold text-right focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
            />
          </div>
          {savings > 0 && (
            <div className="mt-1.5 text-xs font-medium text-[var(--success)]">
              💰 Risparmio per il cliente: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(savings)}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Messaggio (opzionale)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Presentati e spiega perche sei il professionista giusto..."
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-accent w-full py-3 text-base disabled:opacity-50"
        >
          {loading ? 'Invio...' : '💰 Invia offerta'}
        </button>
      </form>
    </div>
  );
}
