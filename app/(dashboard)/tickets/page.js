import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TicketListView from '@/app/components/TicketListView';
import styles from './TicketList.module.css';

export const metadata = {
  title: 'Tickets — ServiceDesk',
};

export default async function TicketsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;

  // Build Prisma query filter based on server parameters
  const where = { orgId };

  const filter = searchParams?.filter;
  if (filter === 'mine') {
    where.assigneeId = session.user.id;
  } else if (filter === 'unassigned') {
    where.assigneeId = null;
    where.status = { notIn: ['CLOSED', 'RESOLVED'] };
  } else if (filter === 'overdue') {
    where.dueAt = { lt: new Date() };
    where.status = { notIn: ['CLOSED', 'RESOLVED'] };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      contact: { select: { id: true, name: true, email: true } },
      department: { select: { name: true } },
    },
  });

  const activeFilter = filter || 'all';

  return (
    <div className={styles.page}>
      <TicketListView
        key={activeFilter}
        initialTickets={tickets}
        activeFilter={activeFilter}
      />
    </div>
  );
}
