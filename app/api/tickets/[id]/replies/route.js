import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession, isStaff, assertInternalNoteAllowed } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createReplySchema = z.object({
  bodyHtml: z.string().trim().min(2, "Reply must be at least 2 characters.").max(10000),
  isPrivate: z.boolean().optional().default(false),
});

export async function GET(request, { params }) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id, orgId: user.orgId },
      select: { id: true },
    });

    if (!ticket) {
      throw new HttpError(404, "Ticket not found.");
    }

    const replies = await prisma.ticketReply.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    return json({ replies });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const payload = await parseJson(request, createReplySchema);

    assertInternalNoteAllowed(user, payload.isPrivate);

    const ticket = await prisma.ticket.findUnique({
      where: { id, orgId: user.orgId },
      select: { id: true, status: true },
    });

    if (!ticket) {
      throw new HttpError(404, "Ticket not found.");
    }

    const reply = await prisma.$transaction(async (tx) => {
      const created = await tx.ticketReply.create({
        data: {
          ticketId: id,
          authorId: user.id,
          bodyHtml: payload.bodyHtml,
          isPrivate: payload.isPrivate,
        },
        include: {
          author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          ticketId: id,
          actorId: user.id,
          actionType: payload.isPrivate ? "ticket.note.added" : "ticket.reply.added",
          newValue: {
            replyId: created.id,
            isPrivate: created.isPrivate,
          },
        },
      });

      return created;
    });

    return json({ reply }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
