import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-base">R</span>
            </div>
            <span className="text-xl font-extrabold">Ri<span className="text-[var(--primary)]">basta</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--muted)]">
            <Link href="/come-funziona" className="hover:text-[var(--foreground)] transition-colors">Come funziona</Link>
            <Link href="/categorie" className="hover:text-[var(--foreground)] transition-colors">Categorie</Link>
            <Link href="/aste-pubbliche" className="hover:text-[var(--foreground)] transition-colors">Aste attive</Link>
            <Link href="/faq" className="hover:text-[var(--foreground)] transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost text-sm">Accedi</Link>
            <Link href="/registrati" className="btn btn-primary text-sm shadow-md shadow-blue-500/20">Inizia gratis</Link>
          </div>
        </div>
      </nav>
      <main className="container-app py-8">
        {children}
      </main>
      <footer className="py-10 border-t border-[var(--border)] bg-white">
        <div className="container-app">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-extrabold text-xs">R</span>
              </div>
              <span className="font-extrabold text-sm">Ribasta</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
              <Link href="/come-funziona" className="hover:text-[var(--foreground)]">Come funziona</Link>
              <Link href="/categorie" className="hover:text-[var(--foreground)]">Categorie</Link>
              <Link href="/faq" className="hover:text-[var(--foreground)]">FAQ</Link>
              <Link href="/contatti" className="hover:text-[var(--foreground)]">Contatti</Link>
              <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            </div>
            <p className="text-xs text-[var(--muted-light)]">© 2026 Ribasta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
