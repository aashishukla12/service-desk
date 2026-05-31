import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession, isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  assigneeId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  subject: z.string().trim().min(5).max(200).optional(),
  description: z.string().trim().min(10).max(10000).optional(),
}).strict();

export async function GET(request, { params }) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id, orgId: user.orgId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        contact: { select: { id: true, name: true, email: true, phone: true } },
        department: { select: { id: true, name: true } },
        slaPolicy: true,
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            actor: { select: { id: true, name: true } },
          },
        },
        tags: {
          include: { tag: true },
        },
        timeLogs: {
          include: { agent: { select: { name: true } } },
          orderBy: { loggedAt: "desc" },
        },
      },
    });

    if (!ticket) {
      throw new HttpError(404, "Ticket not found.");
    }

    return json({ ticket });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await requireSession();
    if (!isStaff(user.role)) {
      throw new HttpError(403, "Only staff can update tickets.");
    }

    const { id } = await params;
    const payload = await parseJson(request, updateTicketSchema);

    const existing = await prisma.ticket.findUnique({
      where: { id, orgId: user.orgId },
      select: { id: true, status: true, priority: true, assigneeId: true, departmentId: true, subject: true },
    });

    if (!existing) {
      throw new HttpError(404, "Ticket not found.");
    }

    // Role-based Access Control Check:
    // If the user is not an Admin, they can only resolve/update a ticket if it is currently UNASSIGNED
    // or if they are the ASSIGNED agent. They are BLOCKED from updating tickets assigned to others.
    const isUserAdmin = user.role === "ADMIN";
    const isAssignedToOther = existing.assigneeId !== null && existing.assigneeId !== user.id;

    if (!isUserAdmin && isAssignedToOther) {
      throw new HttpError(
        403,
        "Access denied. You cannot modify this ticket because it is assigned to another agent."
      );
    }

    // Build update data and track changes for audit log
    const updateData = {};
    const oldValues = {};
    const newValues = {};

    if (payload.status !== undefined && payload.status !== existing.status) {
      oldValues.status = existing.status;
      newValues.status = payload.status;
      updateData.status = payload.status;

      if (payload.status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      } else if (payload.status === "CLOSED") {
        updateData.closedAt = new Date();
      }
    }

    if (payload.priority !== undefined && payload.priority !== existing.priority) {
      oldValues.priority = existing.priority;
      newValues.priority = payload.priority;
      updateData.priority = payload.priority;
    }

    if (payload.assigneeId !== undefined && payload.assigneeId !== existing.assigneeId) {
      oldValues.assigneeId = existing.assigneeId;
      newValues.assigneeId = payload.assigneeId;
      updateData.assigneeId = payload.assigneeId;
    }

    if (payload.departmentId !== undefined && payload.departmentId !== existing.departmentId) {
      oldValues.departmentId = existing.departmentId;
      newValues.departmentId = payload.departmentId;
      updateData.departmentId = payload.departmentId;
    }

    if (payload.subject !== undefined) {
      updateData.subject = payload.subject;
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description;
    }

    if (Object.keys(updateData).length === 0) {
      return json({ ticket: existing });
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          contact: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });

      if (Object.keys(newValues).length > 0) {
        await tx.activityLog.create({
          data: {
            ticketId: id,
            actorId: user.id,
            actionType: "ticket.updated",
            oldValue: oldValues,
            newValue: newValues,
          },
        });
      }

      return updated;
    });

    return json({ ticket });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireSession();
    if (!isStaff(user.role)) {
      throw new HttpError(403, "Only staff can delete tickets.");
    }

    const { id } = await params;

    const existing = await prisma.ticket.findUnique({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Ticket not found.");
    }

    await prisma.ticket.delete({ where: { id } });

    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
