import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BarChart3, Star, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import styles from './Reports.module.css';

export const metadata = {
  title: 'Reports — ServiceDesk',
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const orgId = session.user.orgId;

  // Run database analytics
  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    slaBreached,
    csatStats,
    deptStats,
  ] = await Promise.all([
    prisma.ticket.count({ where: { orgId } }),
    prisma.ticket.count({ where: { orgId, status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
    prisma.ticket.count({ where: { orgId, status: { in: ['CLOSED', 'RESOLVED'] } } }),
    prisma.ticket.count({
      where: {
        orgId,
        dueAt: { lt: new Date() },
        status: { notIn: ['CLOSED', 'RESOLVED'] },
      },
    }),
    prisma.cSATRating.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.department.findMany({
      where: { orgId },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    }),
  ]);

  const avgCsat = csatStats._avg.rating ? csatStats._avg.rating.toFixed(1) : '0.0';
  const totalCsat = csatStats._count.rating;

  // Calculate compliance rate
  const metSla = resolvedTickets - slaBreached;
  const slaCompliance = resolvedTickets > 0 
    ? Math.round((Math.max(0, metSla) / resolvedTickets) * 100) 
    : 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports & Analytics</h1>
        <p className={styles.subtitle}>Track SLA compliance, agent performance, customer satisfaction, and ticket trends.</p>
      </div>

      {/* Overview Cards */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Star className={styles.iconStar} size={20} />
            <h3>Customer Satisfaction</h3>
          </div>
          <div className={styles.metric}>{avgCsat} <span className={styles.metricSub}>/ 5.0</span></div>
          <p className={styles.cardDesc}>Based on {totalCsat} ratings from resolved tickets.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <CheckCircle className={styles.iconSla} size={20} />
            <h3>SLA Compliance</h3>
          </div>
          <div className={styles.metric}>{slaCompliance}%</div>
          <p className={styles.cardDesc}>Resolution SLA compliance rate across all tickets.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <AlertTriangle className={styles.iconBreach} size={20} />
            <h3>Active Breaches</h3>
          </div>
          <div className={styles.metric}>{slaBreached}</div>
          <p className={styles.cardDesc}>Unresolved tickets that have breached their SLA target.</p>
        </div>
      </div>

      <div className={styles.sectionsGrid}>
        {/* Department Volume */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Ticket Load by Department</h2>
          <div className={styles.list}>
            {deptStats.map((dept) => {
              const percentage = totalTickets > 0 ? Math.round((dept._count.tickets / totalTickets) * 100) : 0;
              return (
                <div key={dept.id} className={styles.listItem}>
                  <div className={styles.listLabel}>
                    <span className={styles.deptName}>{dept.name}</span>
                    <span className={styles.deptCount}>{dept._count.tickets} tickets ({percentage}%)</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBar} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Load */}
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Operational Load</h2>
          <div className={styles.statList}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Tickets Ingested</span>
              <span className={styles.statVal}>{totalTickets}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Active Unresolved Backlog</span>
              <span className={styles.statVal}>{openTickets}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Completed Resolutions</span>
              <span className={styles.statVal}>{resolvedTickets}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
