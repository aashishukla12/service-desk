import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  // Restrict all settings routes (under /settings) exclusively to Admin role
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
