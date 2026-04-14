'use client';

import { useState, useEffect } from 'react';

interface Professional {
  id: string;
  userId: string;
  businessName: string;
  vatNumber: string;
  status: string;
  city: string | null;
  province: string | null;
  hasInsurance: boolean;
  hasLicense: boolean;
  userName: string;
  userEmail: string;
}

export default function AdminProfessionalPage() {
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  async function loadPros() {
    setLoading(true);
    const res = await fetch(`/api/admin/professionals?status=${filter}`);
    if (res.ok) {
      const { data } = await res.json();
      setPros(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadPros(); }, [filter]);

  async function updateStatus(proId: string, status: string) {
    const res = await fetch(`/api/admin/professionals/${proId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadPros();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Gestione Professionisti</h1>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-[var(--primary)] text-white' : 'bg-[var(--border-light)] text-[var(--muted)]'
            }`}
          >
            {f === 'pending' ? 'In attesa' : f === 'approved' ? 'Approvati' : f === 'rejected' ? 'Rifiutati' : 'Tutti'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>
      ) : pros.length > 0 ? (
        <div className="space-y-3">
          {pros.map(pro => (
            <div key={pro.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-lg">{pro.businessName}</div>
                  <div className="text-sm text-[var(--muted)]">{pro.userName} — {pro.userEmail}</div>
                  <div className="text-sm text-[var(--muted)]">P.IVA: {pro.vatNumber}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {pro.hasInsurance && <span className="badge bg-green-100 text-green-700">🛡️ Assicurato</span>}
                    {pro.hasLicense && <span className="badge bg-blue-100 text-blue-700">📜 Abilitato</span>}
                    {pro.city && <span className="badge bg-gray-100 text-gray-600">📍 {pro.city}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {pro.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(pro.id, 'approved')} className="btn btn-primary text-xs px-3 py-1.5">
                        ✓ Approva
                      </button>
                      <button onClick={() => updateStatus(pro.id, 'rejected')} className="btn text-xs px-3 py-1.5 bg-[var(--danger)] text-white hover:opacity-80">
                        ✗ Rifiuta
                      </button>
                    </>
                  )}
                  {pro.status === 'approved' && <span className="badge bg-green-100 text-green-700">Approvato</span>}
                  {pro.status === 'rejected' && <span className="badge bg-red-100 text-red-700">Rifiutato</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-[var(--muted)]">Nessun professionista {filter === 'pending' ? 'in attesa' : ''}</p>
        </div>
      )}
    </div>
  );
}
