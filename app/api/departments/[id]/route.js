import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  emailAddress: z.string().trim().email("Invalid email address.").optional().nullable().or(z.literal('')),
  timezone: z.string().trim().optional().default("UTC"),
});

export async function PUT(request, { params }) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN') {
      throw new HttpError(403, "Only administrators can update departments.");
    }

    const { id } = params;
    const existing = await prisma.department.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Department not found.");
    }

    const payload = await parseJson(request, updateDepartmentSchema);
    const email = payload.emailAddress ? payload.emailAddress.toLowerCase() : null;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: payload.name,
        emailAddress: email || null,
        timezone: payload.timezone || 'UTC',
      },
    });

    return json({ department: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN') {
      throw new HttpError(403, "Only administrators can delete departments.");
    }

    const { id } = params;
    const existing = await prisma.department.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Department not found.");
    }

    await prisma.department.delete({
      where: { id },
    });

    return json({ message: "Department deleted successfully." });
  } catch (error) {
    return handleRouteError(error);
  }
}
