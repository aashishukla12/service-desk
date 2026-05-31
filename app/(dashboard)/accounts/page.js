import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AccountsManager from '@/app/components/AccountsManager';

export const metadata = {
  title: 'Accounts — ServiceDesk',
};

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;
  const isAdminOrAgent = session.user.role === 'ADMIN' || session.user.role === 'AGENT';

  const accounts = await prisma.account.findMany({
    where: { orgId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  });

  // Serialize dates
  const serializedAccounts = accounts.map((acc) => ({
    ...acc,
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 12px 48px' }}>
      <AccountsManager initialAccounts={serializedAccounts} hasWriteAccess={isAdminOrAgent} />
    </div>
  );
}
