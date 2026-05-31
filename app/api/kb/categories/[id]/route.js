import { json, handleRouteError, parseJson } from "@/lib/http";
import { requireSession, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export async function PUT(request, { params }) {
  try {
    const user = await requireSession();
    requireRole(user, "ADMIN");
    const { id } = await params;
    const payload = await parseJson(request, updateCategorySchema);

    const category = await prisma.kBCategory.update({
      where: { id, orgId: user.orgId },
      data: payload,
    });
    return json({ category });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireSession();
    requireRole(user, "ADMIN");
    const { id } = await params;

    await prisma.kBArticle.updateMany({
      where: { categoryId: id, orgId: user.orgId },
      data: { categoryId: null },
    });

    await prisma.kBCategory.delete({
      where: { id, orgId: user.orgId },
    });
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
