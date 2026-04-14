'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  auctionId: string;
  status: string;
}

export function AuctionAdminActions({ auctionId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [extendDays, setExtendDays] = useState(3);

  async function doAction(action: string, extra?: Record<string, unknown>) {
    if (!confirm(`Confermi l'azione "${action}" su questa asta?`)) return;
    setLoading(true);
    await fetch(`/api/admin/auctions/${auctionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    setLoading(false);
    router.refresh();
  }

  if (!['active', 'awarded'].includes(status)) return null;

  return (
    <div className="card p-5 border-amber-200 bg-amber-50/50">
      <h3 className="font-bold text-sm text-amber-800 mb-3">Azioni Admin</h3>
      <div className="flex flex-wrap items-center gap-3">
        {status === 'active' && (
          <>
            <button
              onClick={() => doAction('cancel')}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              ✗ Annulla asta
            </button>
            <button
              onClick={() => doAction('force_close')}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              ⏹ Chiudi forzatamente
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={extendDays}
                onChange={e => setExtendDays(parseInt(e.target.value) || 3)}
                min={1}
                max={30}
                className="w-16 rounded-xl border border-amber-300 px-2 py-2 text-sm text-center"
              />
              <button
                onClick={() => doAction('extend', { extendDays })}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                ⏱ Estendi (+{extendDays}gg)
              </button>
            </div>
          </>
        )}
        {status === 'awarded' && (
          <button
            onClick={() => doAction('cancel')}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            ✗ Annulla asta assegnata
          </button>
        )}
      </div>
    </div>
  );
}
