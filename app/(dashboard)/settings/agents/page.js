import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AgentManagementView from './AgentManagementView';

export const metadata = {
  title: 'Agent Management — ServiceDesk',
};

export default async function AgentManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.department.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <AgentManagementView
      initialUsers={users}
      departments={departments}
      currentUser={session.user}
    />
  );
}
