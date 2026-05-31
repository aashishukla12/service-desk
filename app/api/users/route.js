import { json, handleRouteError, parseJson, HttpError } from "@/lib/http";
import { requireSession, isAdmin, isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address.").max(320),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  role: z.enum(["ADMIN", "AGENT", "LIGHT_AGENT"]).default("AGENT"),
  departmentId: z.string().optional(),
});

export async function GET(request) {
  try {
    const user = await requireSession();
    if (!isStaff(user.role)) {
      throw new HttpError(403, "Only staff can view users.");
    }

    const { searchParams } = new URL(request.url);
    const where = { orgId: user.orgId };

    const role = searchParams.get("role");
    if (role) where.role = role;

    const departmentId = searchParams.get("departmentId");
    if (departmentId) where.departmentId = departmentId;

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
      },
    });

    return json({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireSession();
    if (!isAdmin(user.role)) {
      throw new HttpError(403, "Only admins can create users.");
    }

    const payload = await parseJson(request, createUserSchema);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existing) {
      throw new HttpError(409, "A user with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const newUser = await prisma.user.create({
      data: {
        orgId: user.orgId,
        name: payload.name,
        email: payload.email.toLowerCase(),
        passwordHash,
        role: payload.role,
        departmentId: payload.departmentId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: { select: { id: true, name: true } },
      },
    });

    return json({ user: newUser }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
