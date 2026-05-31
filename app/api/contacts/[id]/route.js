import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().email("Invalid email address.").max(320),
  phone: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  accountId: z.string().optional().nullable().or(z.literal('')),
});

export async function PUT(request, { params }) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new HttpError(403, "Only support staff can update contacts.");
    }

    const { id } = params;
    const existing = await prisma.contact.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Contact not found.");
    }

    const payload = await parseJson(request, updateContactSchema);

    if (payload.accountId) {
      const acc = await prisma.account.findFirst({
        where: { id: payload.accountId, orgId: user.orgId },
      });
      if (!acc) {
        throw new HttpError(400, "Selected account was not found.");
      }
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        phone: payload.phone || null,
        accountId: payload.accountId || null,
      },
      include: { account: { select: { id: true, name: true } } },
    });

    return json({ contact: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new HttpError(403, "Only support staff can delete contacts.");
    }

    const { id } = params;
    const existing = await prisma.contact.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!existing) {
      throw new HttpError(404, "Contact not found.");
    }

    await prisma.contact.delete({
      where: { id },
    });

    return json({ message: "Contact deleted successfully." });
  } catch (error) {
    return handleRouteError(error);
  }
}
