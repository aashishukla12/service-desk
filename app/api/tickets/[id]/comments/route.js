import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession, isStaff, assertInternalNoteAllowed } from "@/lib/rbac";
import { withTransaction } from "@/lib/db";
import { createCommentSchema, ticketIdParamSchema } from "@/lib/validation/tickets";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const parsedTicketId = ticketIdParamSchema.safeParse(params.id);

    if (!parsedTicketId.success) {
      throw new HttpError(400, "Ticket id must be a positive integer.");
    }

    const ticketId = parsedTicketId.data;
    const user = await requireSession();
    const payload = await parseJson(request, createCommentSchema);

    assertInternalNoteAllowed(user, payload.is_internal_note);

    const comment = await withTransaction(async (client) => {
      const ticketResult = await client.query(
        `
          SELECT id, customer_id
          FROM tickets
          WHERE id = $1
          FOR SHARE
        `,
        [ticketId]
      );

      const ticket = ticketResult.rows[0];

      if (!ticket) {
        throw new HttpError(404, "Ticket was not found.");
      }

      if (!isStaff(user.role) && Number(ticket.customer_id) !== user.id) {
        throw new HttpError(403, "You do not have access to this ticket.");
      }

      const insertResult = await client.query(
        `
          INSERT INTO ticket_timeline (ticket_id, author_id, body, is_internal_note)
          VALUES ($1, $2, $3, $4)
          RETURNING id, ticket_id, author_id, body, is_internal_note, created_at
        `,
        [ticketId, user.id, payload.body, payload.is_internal_note]
      );

      await client.query(
        `
          INSERT INTO audit_logs (ticket_id, actor_id, action_type, old_value, new_value)
          VALUES ($1, $2, $3, '{}'::jsonb, $4::jsonb)
        `,
        [
          ticketId,
          user.id,
          payload.is_internal_note ? "ticket.internal_note.created" : "ticket.comment.created",
          JSON.stringify({
            comment_id: insertResult.rows[0].id,
            is_internal_note: insertResult.rows[0].is_internal_note
          })
        ]
      );

      return insertResult.rows[0];
    });

    return json({ comment }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
