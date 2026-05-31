import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  website: z.string().trim().optional().nullable().or(z.literal('')),
  industry: z.string().trim().max(100).optional().nullable().or(z.literal('')),
});

export async function PUT(request, { params }) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new HttpError(403, "Only support staff can update accounts.");
    }

    const { id } = params;
    const existing = await prisma.account.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Account not found.");
    }

    const payload = await parseJson(request, updateAccountSchema);

    const updated = await prisma.account.update({
      where: { id },
      data: {
        name: payload.name,
        website: payload.website || null,
        industry: payload.industry || null,
      },
      include: { _count: { select: { contacts: true } } },
    });

    return json({ account: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new HttpError(403, "Only support staff can delete accounts.");
    }

    const { id } = params;
    const existing = await prisma.account.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Account not found.");
    }

    await prisma.account.delete({
      where: { id },
    });

    return json({ message: "Account deleted successfully." });
  } catch (error) {
    return handleRouteError(error);
  }
}
