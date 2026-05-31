import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Monitor,
  Building,
  User as UserIcon,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  Lock,
  MessageSquare,
} from 'lucide-react';
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatDateTime,
  formatRelativeTime,
  formatSLACountdown,
  getInitials,
} from '@/lib/utils';
import ReplyComposer from '@/app/components/ReplyComposer';
import TicketPropertiesPanel from '@/app/components/TicketPropertiesPanel';
import styles from './TicketDetail.module.css';

export const metadata = {
  title: 'Ticket Details — ServiceDesk',
};

export default async function TicketDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/sign-in');

  const { id } = await params;
  const orgId = session.user.orgId;

  // Fetch ticket details, active staff users, and departments concurrently
  const [ticket, staffUsers, departments] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id, orgId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        contact: { select: { id: true, name: true, email: true, phone: true } },
        department: { select: { id: true, name: true } },
        slaPolicy: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            actor: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.department.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!ticket) {
    redirect('/tickets');
  }

  const statusColor = getStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);
  const slaInfo = formatSLACountdown(ticket.dueAt);

  // Pick channel icon
  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail size={16} />;
      case 'PHONE':
        return <Phone size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  return (
    <div className={styles.page}>
      {/* Back navigation */}
      <div className={styles.backNav}>
        <Link href="/tickets" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Tickets
        </Link>
      </div>

      {/* 70/30 Grid */}
      <div className={styles.grid}>
        {/* Left Column — 70% */}
        <div className={styles.leftCol}>
          {/* Ticket Header Card */}
          <div className={styles.ticketHeaderCard}>
            <div className={styles.headerMeta}>
              <span className={styles.ticketId}>#{ticket.id.slice(0, 8)}</span>
              <span className={styles.metaSep}>•</span>
              <span className={styles.channelBadge}>
                {getChannelIcon(ticket.channel)}
                <span>{ticket.channel}</span>
              </span>
            </div>

            <h1 className={styles.subject}>{ticket.subject}</h1>

            <div className={styles.badgeRow}>
              <span
                className={styles.statusBadge}
                style={{
                  backgroundColor: `${statusColor}18`,
                  color: statusColor,
                }}
              >
                {getStatusLabel(ticket.status)}
              </span>

              <span
                className={styles.priorityBadge}
                style={{
                  backgroundColor: `${priorityColor}18`,
                  color: priorityColor,
                }}
              >
                {getPriorityLabel(ticket.priority)}
              </span>
            </div>

            {/* Original description */}
            <div className={styles.descriptionBlock}>
              <div className={styles.descriptionHeader}>
                <div className={styles.authorAvatar}>
                  {getInitials(ticket.contact?.name || 'Customer')}
                </div>
                <div>
                  <div className={styles.authorName}>{ticket.contact?.name || 'Customer'}</div>
                  <div className={styles.authorEmail}>{ticket.contact?.email}</div>
                </div>
                <div className={styles.descriptionTime}>
                  {formatDateTime(ticket.createdAt)}
                </div>
              </div>
              <div className={styles.descriptionBody}>{ticket.description}</div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className={styles.threadSection}>
            <h3 className={styles.threadTitle}>
              <MessageSquare size={16} />
              <span>Conversation Thread ({ticket.replies.length})</span>
            </h3>

            {ticket.replies.length === 0 ? (
              <div className={styles.emptyThread}>
                No replies or notes yet. Use the composer below to add one.
              </div>
            ) : (
              <div className={styles.repliesList}>
                {ticket.replies.map((reply) => {
                  const isPrivate = reply.isPrivate;
                  const authorInitials = getInitials(reply.author.name);

                  return (
                    <div
                      key={reply.id}
                      className={`${styles.replyCard} ${
                        isPrivate ? styles.privateReplyCard : ''
                      }`}
                    >
                      <div className={styles.replyHeader}>
                        <div className={styles.replyAuthor}>
                          <div
                            className={`${styles.authorAvatar} ${
                              isPrivate ? styles.privateAvatar : ''
                            }`}
                          >
                            {authorInitials}
                          </div>
                          <div>
                            <span className={styles.replyAuthorName}>
                              {reply.author.name}
                            </span>
                            <span className={styles.roleBadge}>{reply.author.role}</span>
                            {isPrivate && (
                              <span className={styles.privateLabel}>
                                <Lock size={10} />
                                <span>Internal Note</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.replyTime}>
                          {formatRelativeTime(reply.createdAt)}
                        </div>
                      </div>
                      <div
                        className={styles.replyBody}
                        dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className={styles.composerSection}>
            <ReplyComposer ticketId={ticket.id} />
          </div>
        </div>

        {/* Right Column — 30% */}
        <div className={styles.rightCol}>
          {/* SLA countdown */}
          {ticket.dueAt && (
            <div
              className={`${styles.slaCard} ${
                slaInfo.isOverdue
                  ? styles.slaBreached
                  : slaInfo.status === 'warning'
                  ? styles.slaWarning
                  : styles.slaOk
              }`}
            >
              <div className={styles.slaHeader}>
                <Clock size={16} />
                <span>SLA Resolution Target</span>
              </div>
              <div className={styles.slaTime}>{slaInfo.text}</div>
              <div className={styles.slaDue}>
                Due on {formatDateTime(ticket.dueAt)}
              </div>
            </div>
          )}

          {/* Interactive Properties Panel */}
          <TicketPropertiesPanel
            ticket={ticket}
            staffUsers={staffUsers}
            departments={departments}
            currentUser={session.user}
          />

          {/* Activity Log Timeline */}
          <div className={styles.card}>
            <div className={styles.cardTitleWithIcon}>
              <Activity size={16} className={styles.titleIcon} />
              <h3 className={styles.cardTitle}>Activity Log</h3>
            </div>
            <div className={styles.timeline}>
              {ticket.activityLogs.length === 0 ? (
                <div className={styles.emptyLogs}>No recent activity logged.</div>
              ) : (
                ticket.activityLogs.map((log) => (
                  <div key={log.id} className={styles.timelineItem}>
                    <div className={styles.timelinePoint} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineText}>
                        <b>{log.actor?.name || 'System'}</b>{' '}
                        <span>
                          {log.actionType === 'ticket.reply.added'
                            ? 'added a public reply'
                            : log.actionType === 'ticket.note.added'
                            ? 'added an internal note'
                            : log.actionType === 'ticket.updated'
                            ? 'updated ticket parameters'
                            : log.actionType}
                        </span>
                      </div>
                      <div className={styles.timelineTime}>
                        {formatRelativeTime(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
