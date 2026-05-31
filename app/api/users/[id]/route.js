import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession, isAdmin, isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "AGENT", "LIGHT_AGENT"]).optional(),
  departmentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

export async function GET(request, { params }) {
  try {
    const currentUser = await requireSession();
    if (!isStaff(currentUser.role)) {
      throw new HttpError(403, "Only staff can view user details.");
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id, orgId: currentUser.orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            assignedTickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    return json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const currentUser = await requireSession();
    if (!isAdmin(currentUser.role)) {
      throw new HttpError(403, "Only admins can update users.");
    }

    const { id } = await params;
    const payload = await parseJson(request, updateUserSchema);

    const existing = await prisma.user.findUnique({
      where: { id, orgId: currentUser.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "User not found.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
      },
    });

    return json({ user: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
