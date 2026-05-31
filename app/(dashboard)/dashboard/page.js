import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Ticket,
  AlertCircle,
  Clock,
  UserX,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatRelativeTime,
  getInitials,
} from '@/lib/utils';
import styles from './Dashboard.module.css';

export const metadata = {
  title: 'Dashboard — ServiceDesk',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;
  const userName = session.user.name || 'Agent';

  const [total, open, overdue, unassigned, recentTickets] = await Promise.all([
    prisma.ticket.count({ where: { orgId } }),
    prisma.ticket.count({ where: { orgId, status: 'OPEN' } }),
    prisma.ticket.count({
      where: {
        orgId,
        dueAt: { lt: new Date() },
        status: { notIn: ['CLOSED', 'RESOLVED'] },
      },
    }),
    prisma.ticket.count({
      where: {
        orgId,
        assigneeId: null,
        status: { notIn: ['CLOSED', 'RESOLVED'] },
      },
    }),
    prisma.ticket.findMany({
      where: { orgId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { name: true } },
        contact: { select: { name: true } },
      },
    }),
  ]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const stats = [
    {
      label: 'Total Tickets',
      value: total,
      icon: <Ticket size={20} />,
      colorClass: 'Blue',
    },
    {
      label: 'Open Tickets',
      value: open,
      icon: <AlertCircle size={20} />,
      colorClass: 'Blue',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: <Clock size={20} />,
      colorClass: overdue > 0 ? 'Red' : 'Amber',
    },
    {
      label: 'Unassigned',
      value: unassigned,
      icon: <UserX size={20} />,
      colorClass: unassigned > 0 ? 'Amber' : 'Gray',
    },
  ];

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>Welcome back, {userName}</h1>
        <p className={styles.welcomeDate}>{today}</p>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${styles.statCard} ${styles[`statCard${stat.colorClass}`]}`}
          >
            <div className={`${styles.statIcon} ${styles[`statIcon${stat.colorClass}`]}`}>
              {stat.icon}
            </div>
            <span className={styles.statNumber}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.actions}>
        <Link href="/tickets/new" className={styles.btnPrimary}>
          <Plus size={16} />
          Create Ticket
        </Link>
        <Link href="/tickets" className={styles.btnSecondary}>
          View All Tickets
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Recent Tickets */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Tickets</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>
                    No tickets yet. Create your first ticket to get started.
                  </td>
                </tr>
              ) : (
                recentTickets.map((ticket) => {
                  const statusColor = getStatusColor(ticket.status);
                  const priorityColor = getPriorityColor(ticket.priority);
                  return (
                    <tr key={ticket.id}>
                      <td className={styles.subjectCell}>
                        <Link href={`/tickets/${ticket.id}`}>
                          {ticket.subject}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background: `${statusColor}18`,
                            color: statusColor,
                          }}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            background: `${priorityColor}18`,
                            color: priorityColor,
                          }}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td>
                        {ticket.assignee ? (
                          <div className={styles.assignee}>
                            <span className={styles.avatar}>
                              {getInitials(ticket.assignee.name)}
                            </span>
                            {ticket.assignee.name}
                          </div>
                        ) : (
                          <span className={styles.unassigned}>Unassigned</span>
                        )}
                      </td>
                      <td className={styles.dateCell}>
                        {formatRelativeTime(ticket.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
