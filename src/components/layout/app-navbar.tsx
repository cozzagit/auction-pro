'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface Props {
  user: { name: string; email: string; role: string };
}

const CUSTOMER_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/aste/nuova', label: 'Nuova Asta', icon: '➕' },
  { href: '/le-mie-aste', label: 'Le Mie Aste', icon: '📋' },
  { href: '/aste', label: 'Esplora', icon: '🔍' },
];

const PRO_LINKS = [
  { href: '/pro/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/pro/offerte', label: 'Le Mie Offerte', icon: '💰' },
  { href: '/aste', label: 'Aste Disponibili', icon: '🔍' },
  { href: '/pro/profilo', label: 'Profilo Pro', icon: '👤' },
];

const ADMIN_LINKS = [
  { href: '/admin', label: 'Admin', icon: '⚙️' },
  { href: '/admin/professionisti', label: 'Professionisti', icon: '👷' },
  { href: '/admin/aste', label: 'Aste', icon: '📋' },
  { href: '/admin/categorie', label: 'Categorie', icon: '📂' },
  { href: '/admin/utenti', label: 'Utenti', icon: '👥' },
];

export function AppNavbar({ user }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user.role === 'admin' ? ADMIN_LINKS
    : user.role === 'professional' ? PRO_LINKS
    : CUSTOMER_LINKS;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--border)] shadow-sm">
      <div className="container-app flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">R</span>
            </div>
            <span className="text-lg font-extrabold hidden sm:inline">Ri<span className="text-[var(--primary)]">basta</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-blue-50 text-[var(--primary)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-light)]'
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-medium text-[var(--foreground)] leading-tight">{user.name}</div>
              <div className="text-[11px] text-[var(--muted)]">{user.role === 'professional' ? 'Professionista' : user.role === 'admin' ? 'Admin' : 'Cliente'}</div>
            </div>
          </div>

          <Link href="/profilo" className="hidden sm:block btn btn-ghost text-xs px-2 py-1">
            Profilo
          </Link>

          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="btn btn-ghost text-xs px-2 py-1 text-[var(--danger)]">
              Esci
            </button>
          </form>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--border-light)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                pathname === link.href
                  ? 'bg-blue-50 text-[var(--primary)]'
                  : 'text-[var(--muted)] hover:bg-[var(--border-light)]'
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
