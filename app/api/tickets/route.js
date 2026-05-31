import { json, handleRouteError, parseJson } from "@/lib/http";
import { requireSession, isStaff } from "@/lib/rbac";
import { withTransaction, pool } from "@/lib/db";
import { createTicketSchema, computeSlaDueAt } from "@/lib/validation/tickets";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await requireSession();
    const payload = await parseJson(request, createTicketSchema);
    const slaDueAt = computeSlaDueAt(payload.priority);

    const ticket = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `
          INSERT INTO tickets (title, description, priority, customer_id, sla_due_at)
          VALUES ($1, $2, $3::ticket_priority, $4, $5)
          RETURNING id, uuid, title, description, status, priority, customer_id, assigned_agent_id, sla_due_at, created_at, updated_at
        `,
        [payload.title, payload.description, payload.priority, user.id, slaDueAt.toISOString()]
      );

      const createdTicket = insertResult.rows[0];

      await client.query(
        `
          INSERT INTO ticket_timeline (ticket_id, author_id, body, is_internal_note)
          VALUES ($1, $2, $3, FALSE)
        `,
        [createdTicket.id, user.id, "Ticket created."]
      );

      await client.query(
        `
          INSERT INTO audit_logs (ticket_id, actor_id, action_type, old_value, new_value)
          VALUES ($1, $2, $3, '{}'::jsonb, $4::jsonb)
        `,
        [
          createdTicket.id,
          user.id,
          "ticket.created",
          JSON.stringify({
            title: createdTicket.title,
            priority: createdTicket.priority,
            status: createdTicket.status,
            sla_due_at: createdTicket.sla_due_at
          })
        ]
      );

      return createdTicket;
    });

    return json({ ticket }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const user = await requireSession();

    const baseSelect = `
      SELECT
        t.id,
        t.uuid,
        t.title,
        t.status,
        t.priority,
        t.customer_id,
        t.assigned_agent_id,
        t.sla_due_at,
        t.created_at,
        t.updated_at,
        customer.name AS customer_name,
        agent.name AS assigned_agent_name
      FROM tickets t
      INNER JOIN users customer ON customer.id = t.customer_id
      LEFT JOIN users agent ON agent.id = t.assigned_agent_id
    `;

    const result = isStaff(user.role)
      ? await pool.query(`${baseSelect} ORDER BY t.created_at DESC LIMIT 250`)
      : await pool.query(`${baseSelect} WHERE t.customer_id = $1 ORDER BY t.created_at DESC LIMIT 250`, [user.id]);

    return json({ tickets: result.rows });
  } catch (error) {
    return handleRouteError(error);
  }
}
