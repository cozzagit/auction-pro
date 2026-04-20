import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppNavbar } from '@/components/layout/app-navbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (session.user.role !== 'admin') redirect('/dashboard');

  const user = {
    name: session.user.name || '',
    email: session.user.email || '',
    role: 'admin',
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNavbar user={user} />
      <main className="container-app py-6 pb-24 md:pb-6 animate-fade-in">
        {children}
      </main>
      <MobileBottomNav role={user.role} />
    </div>
  );
}
