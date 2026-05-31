import { getServerSession } from "next-auth";
import { FiActivity } from "react-icons/fi";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isStaff } from "@/lib/rbac";
import AgentTicketTable from "@/app/components/AgentTicketTable";
import styles from "./AgentTicketDashboard.module.css";

async function loadTickets() {
  const result = await pool.query(
    `
      SELECT
        t.id,
        t.uuid,
        t.title,
        t.status,
        t.priority,
        t.sla_due_at,
        t.created_at,
        customer.name AS customer_name
      FROM tickets t
      INNER JOIN users customer ON customer.id = t.customer_id
      ORDER BY
        CASE t.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        t.sla_due_at ASC
      LIMIT 250
    `
  );

  return result.rows.map((row) => ({
    ...row,
    id: Number(row.id),
    sla_due_at: row.sla_due_at instanceof Date ? row.sla_due_at.toISOString() : row.sla_due_at,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }));
}

export default async function AgentTicketDashboard() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.role || !isStaff(user.role)) {
    return (
      <section className={styles.shell}>
        <div className={styles.header}>
          <FiActivity aria-hidden="true" />
          <div>
            <h1>Agent Dashboard</h1>
            <p>Your account does not have access to the service desk queue.</p>
          </div>
        </div>
      </section>
    );
  }

  const tickets = await loadTickets();

  return (
    <section className={styles.shell} aria-labelledby="agent-dashboard-title">
      <div className={styles.header}>
        <FiActivity aria-hidden="true" />
        <div>
          <h1 id="agent-dashboard-title">Agent Dashboard</h1>
          <p>{tickets.length} tickets ordered by operational urgency and SLA risk.</p>
        </div>
      </div>

      <AgentTicketTable tickets={tickets} />
    </section>
  );
}
