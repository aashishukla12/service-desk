import { json, handleRouteError, parseJson } from "@/lib/http";
import { requireSession, isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createTicketSchema = z.object({
  subject: z.string().trim().min(5, "Subject must be at least 5 characters.").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(10000),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  channel: z.enum(["EMAIL", "CHAT", "PHONE", "SOCIAL", "WEB"]).default("WEB"),
  contactId: z.string().optional(),
  departmentId: z.string().optional(),
  assigneeId: z.string().optional(),
});

function computeSlaDueAt(priority, now = new Date()) {
  const hoursByPriority = {
    URGENT: 1,
    HIGH: 4,
    MEDIUM: 24,
    LOW: 48,
  };
  const hours = hoursByPriority[priority] || 24;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export async function POST(request) {
  try {
    const user = await requireSession();
    const payload = await parseJson(request, createTicketSchema);
    const dueAt = computeSlaDueAt(payload.priority);

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          orgId: user.orgId,
          subject: payload.subject,
          description: payload.description,
          priority: payload.priority,
          channel: payload.channel,
          contactId: payload.contactId || null,
          departmentId: payload.departmentId || null,
          assigneeId: payload.assigneeId || null,
          dueAt,
        },
        include: {
          assignee: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          department: { select: { name: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          ticketId: created.id,
          actorId: user.id,
          actionType: "ticket.created",
          newValue: {
            subject: created.subject,
            priority: created.priority,
            status: created.status,
            channel: created.channel,
          },
        },
      });

      return created;
    });

    return json({ ticket }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(request) {
  try {
    const user = await requireSession();
    const { searchParams } = new URL(request.url);

    const where = { orgId: user.orgId };

    // Filters
    const status = searchParams.get("status");
    if (status) where.status = status;

    const priority = searchParams.get("priority");
    if (priority) where.priority = priority;

    const assigneeId = searchParams.get("assigneeId");
    if (assigneeId === "unassigned") {
      where.assigneeId = null;
    } else if (assigneeId === "mine") {
      where.assigneeId = user.id;
    } else if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const filter = searchParams.get("filter");
    if (filter === "mine") {
      where.assigneeId = user.id;
    } else if (filter === "unassigned") {
      where.assigneeId = null;
      where.status = { notIn: ["CLOSED", "RESOLVED"] };
    } else if (filter === "overdue") {
      where.dueAt = { lt: new Date() };
      where.status = { notIn: ["CLOSED", "RESOLVED"] };
    }

    const search = searchParams.get("search");
    if (search) {
      where.subject = { contains: search, mode: "insensitive" };
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          contact: { select: { id: true, name: true, email: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
