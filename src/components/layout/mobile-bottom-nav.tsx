'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CUSTOMER_NAV = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/aste', label: 'Aste', icon: '🔍' },
  { href: '/aste/nuova', label: 'Nuova', icon: '+', primary: true },
  { href: '/le-mie-aste', label: 'Le mie', icon: '📋' },
  { href: '/profilo', label: 'Profilo', icon: '👤' },
];

const PRO_NAV = [
  { href: '/pro/dashboard', label: 'Home', icon: '🏠' },
  { href: '/aste', label: 'Aste', icon: '🔍' },
  { href: '/pro/offerte', label: 'Offerte', icon: '💰' },
  { href: '/pro/profilo', label: 'Profilo', icon: '👤' },
];

const ADMIN_NAV = [
  { href: '/admin', label: 'Admin', icon: '⚙️' },
  { href: '/admin/aste', label: 'Aste', icon: '📋' },
  { href: '/admin/professionisti', label: 'Pro', icon: '👷' },
  { href: '/admin/utenti', label: 'Utenti', icon: '👥' },
  { href: '/admin/pagamenti', label: 'Revenue', icon: '💰' },
];

export function MobileBottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const nav = role === 'admin' ? ADMIN_NAV : role === 'professional' ? PRO_NAV : CUSTOMER_NAV;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--border)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-5 h-16">
        {nav.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          if ('primary' in item && item.primary) {
            return (
              <Link key={item.href} href={item.href} className="flex items-center justify-center">
                <div className="w-14 h-14 -mt-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
                  <span className="text-white text-3xl font-light leading-none">+</span>
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[var(--primary)]' : ''}`}>{item.label}</span>
              {isActive && <span className="absolute top-0 h-0.5 w-8 bg-[var(--primary)] rounded-b-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
