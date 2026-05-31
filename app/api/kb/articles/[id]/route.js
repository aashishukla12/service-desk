import { json, handleRouteError, parseJson } from "@/lib/http";
import { requireSession, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateArticleSchema = z.object({
  title: z.string().trim().min(5).max(200).optional(),
  bodyHtml: z.string().trim().min(10).optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function PUT(request, { params }) {
  try {
    const user = await requireSession();
    requireRole(user, "ADMIN", "AGENT");
    const { id } = await params;
    const payload = await parseJson(request, updateArticleSchema);

    const article = await prisma.kBArticle.update({
      where: { id, orgId: user.orgId },
      data: payload,
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });
    return json({ article });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireSession();
    requireRole(user, "ADMIN");
    const { id } = await params;

    await prisma.kBArticle.delete({
      where: { id, orgId: user.orgId },
    });
    return json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
