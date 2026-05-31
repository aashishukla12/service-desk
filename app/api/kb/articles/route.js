import { json, handleRouteError, parseJson } from "@/lib/http";
import { requireSession, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createArticleSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(200),
  bodyHtml: z.string().trim().min(10, "Content must be at least 10 characters."),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export async function GET() {
  try {
    const user = await requireSession();
    const articles = await prisma.kBArticle.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });
    return json({ articles });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireSession();
    requireRole(user, "ADMIN", "AGENT");
    const payload = await parseJson(request, createArticleSchema);

    const article = await prisma.kBArticle.create({
      data: {
        orgId: user.orgId,
        title: payload.title,
        bodyHtml: payload.bodyHtml,
        categoryId: payload.categoryId || null,
        status: payload.status,
        authorId: user.id,
      },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });
    return json({ article }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
