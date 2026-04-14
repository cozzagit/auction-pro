import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">R</span>
            </div>
            <span className="text-xl font-extrabold">Ri<span className="text-[var(--primary)]">basta</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost text-sm">Accedi</Link>
            <Link href="/registrati" className="btn btn-primary text-sm">Inizia gratis</Link>
          </div>
        </div>
      </nav>
      <main className="container-app py-8">
        {children}
      </main>
      <footer className="py-8 border-t border-[var(--border)] bg-white">
        <div className="container-app text-center text-xs text-[var(--muted)]">
          2026 Ribasta. Tutti i diritti riservati.
        </div>
      </footer>
    </div>
  );
}
