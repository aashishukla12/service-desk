import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  website: z.string().trim().optional().nullable().or(z.literal('')),
  industry: z.string().trim().max(100).optional().nullable().or(z.literal('')),
});

export async function GET(request) {
  try {
    const user = await requireSession();
    const accounts = await prisma.account.findMany({
      where: { orgId: user.orgId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { contacts: true } } },
    });
    return json({ accounts });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN' && user.role !== 'AGENT') {
      throw new HttpError(403, "Only support staff can create accounts.");
    }

    const payload = await parseJson(request, createAccountSchema);

    const account = await prisma.account.create({
      data: {
        orgId: user.orgId,
        name: payload.name,
        website: payload.website || null,
        industry: payload.industry || null,
      },
      include: { _count: { select: { contacts: true } } },
    });

    return json({ account }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
