import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  emailAddress: z.string().trim().email("Invalid email address.").optional().nullable().or(z.literal('')),
  timezone: z.string().trim().optional().default("UTC"),
});

export async function GET(request) {
  try {
    const user = await requireSession();
    const departments = await prisma.department.findMany({
      where: { orgId: user.orgId },
      orderBy: { name: 'asc' },
    });
    return json({ departments });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireSession();
    if (user.role !== 'ADMIN') {
      throw new HttpError(403, "Only administrators can create departments.");
    }

    const payload = await parseJson(request, createDepartmentSchema);
    const email = payload.emailAddress ? payload.emailAddress.toLowerCase() : null;

    const department = await prisma.department.create({
      data: {
        orgId: user.orgId,
        name: payload.name,
        emailAddress: email || null,
        timezone: payload.timezone || 'UTC',
      },
    });

    return json({ department }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
