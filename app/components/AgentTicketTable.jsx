"use client";

import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiCheckCircle, FiClock } from "react-icons/fi";
import styles from "./AgentTicketDashboard.module.css";

const statusLabels = {
  open: "Open",
  assigned: "Assigned",
  pending_customer: "Pending Customer",
  resolved: "Resolved",
  closed: "Closed"
};

function formatDuration(ms) {
  const isOverdue = ms < 0;
  const absoluteMs = Math.abs(ms);
  const totalMinutes = Math.floor(absoluteMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const value = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
  return isOverdue ? `${value} overdue` : value;
}

function StatusIcon({ status }) {
  if (status === "resolved" || status === "closed") {
    return <FiCheckCircle aria-hidden="true" />;
  }

  return <FiActivity aria-hidden="true" />;
}

export default function AgentTicketTable({ tickets }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = useMemo(
    () =>
      tickets.map((ticket) => {
        const dueAt = new Date(ticket.sla_due_at).getTime();
        return {
          ...ticket,
          shortUuid: String(ticket.uuid).slice(0, 8),
          countdown: formatDuration(dueAt - now),
          isOverdue: dueAt < now
        };
      }),
    [now, tickets]
  );

  if (rows.length === 0) {
    return <div className={styles.empty}>No tickets are currently in the queue.</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Priority</th>
            <th>SLA</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ticket) => (
            <tr key={ticket.id}>
              <td className={styles.uuid}>{ticket.shortUuid}</td>
              <td className={styles.subject}>{ticket.title}</td>
              <td>
                <span className={styles.status}>
                  <StatusIcon status={ticket.status} />
                  {statusLabels[ticket.status] || ticket.status}
                </span>
              </td>
              <td>
                <span className={`${styles.priority} ${styles[ticket.priority]}`}>{ticket.priority}</span>
              </td>
              <td>
                <span className={`${styles.sla} ${ticket.isOverdue ? styles.overdue : ""}`}>
                  <FiClock aria-hidden="true" />
                  {ticket.countdown}
                </span>
              </td>
              <td>{ticket.customer_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
