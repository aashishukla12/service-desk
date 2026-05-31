import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: z.string().trim().email("Invalid email address.").max(320),
  phone: z.string().trim().max(30).optional().nullable().or(z.literal('')),
  accountId: z.string().optional().nullable().or(z.literal('')),
});

export async function GET(request) {
  try {
    const user = await requireSession();
    const contacts = await prisma.contact.findMany({
      where: { orgId: user.orgId },
      orderBy: { name: 'asc' },
      include: { account: { select: { id: true, name: true } } },
    });
    return json({ contacts });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new HttpError(403, "Only support staff can create contacts.");
    }

    const payload = await parseJson(request, createContactSchema);

    // If accountId is provided, verify it belongs to the same org
    if (payload.accountId) {
      const acc = await prisma.account.findFirst({
        where: { id: payload.accountId, orgId: user.orgId },
      });
      if (!acc) {
        throw new HttpError(400, "Selected account was not found.");
      }
    }

    const contact = await prisma.contact.create({
      data: {
        orgId: user.orgId,
        name: payload.name,
        email: payload.email.toLowerCase(),
        phone: payload.phone || null,
        accountId: payload.accountId || null,
      },
      include: { account: { select: { id: true, name: true } } },
    });

    return json({ contact }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
