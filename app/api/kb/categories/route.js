import { json, handleRouteError, parseJson } from "@/lib/http";
import { requireSession, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  parentId: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireSession();
    const categories = await prisma.kBCategory.findMany({
      where: { orgId: user.orgId },
      orderBy: { orderIndex: "asc" },
      include: {
        articles: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
      },
    });
    return json({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireSession();
    requireRole(user, "ADMIN");
    const payload = await parseJson(request, createCategorySchema);

    const maxOrder = await prisma.kBCategory.findFirst({
      where: { orgId: user.orgId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const category = await prisma.kBCategory.create({
      data: {
        orgId: user.orgId,
        name: payload.name,
        parentId: payload.parentId || null,
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
      },
    });
    return json({ category }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
