import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HttpError } from "@/lib/http";

const STAFF_ROLES = new Set(["agent", "manager", "admin"]);

export function isStaff(role) {
  return STAFF_ROLES.has(role);
}

export function isAdmin(role) {
  return role === "admin";
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user?.role) {
    throw new HttpError(401, "Authentication is required.");
  }

  return {
    id: Number(user.id),
    orgId: user.orgId === undefined || user.orgId === null ? null : Number(user.orgId),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function assertInternalNoteAllowed(user, isInternalNote) {
  if (isInternalNote && !isStaff(user.role)) {
    throw new HttpError(403, "Only service desk staff can create internal notes.");
  }
}
