import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppNavbar } from '@/components/layout/app-navbar';

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
      <main className="container-app py-6">
        {children}
      </main>
    </div>
  );
}
