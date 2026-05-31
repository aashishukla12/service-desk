import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateTicketForm from '@/app/components/CreateTicketForm';

export const metadata = {
  title: 'New Ticket — ServiceDesk',
};

export default async function NewTicketPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;

  const [departments, contacts, agents] = await Promise.all([
    prisma.department.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    }),
    prisma.contact.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        orgId,
        isActive: true,
        role: { in: ['ADMIN', 'AGENT', 'LIGHT_AGENT'] },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 12px 48px' }}>
      <CreateTicketForm
        departments={departments}
        contacts={contacts}
        agents={agents}
      />
    </div>
  );
}
