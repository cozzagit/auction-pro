import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppNavbar } from '@/components/layout/app-navbar';

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as { role?: string }).role;
  if (role !== 'professional' && role !== 'admin') redirect('/dashboard');

  const user = {
    name: session.user.name || '',
    email: session.user.email || '',
    role: role || 'professional',
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
