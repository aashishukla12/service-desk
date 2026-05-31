import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STAFF_ROLES = new Set(["AGENT", "ADMIN", "LIGHT_AGENT"]);

export function isStaff(role) {
  return STAFF_ROLES.has(role);
}

export function isAdmin(role) {
  return role === "ADMIN";
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user?.role) {
    throw new HttpError(401, "Authentication is required.");
  }

  return {
    id: user.id,
    orgId: user.orgId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

export function requireRole(user, ...roles) {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "You do not have permission to perform this action.");
  }
}

export function assertInternalNoteAllowed(user, isInternalNote) {
  if (isInternalNote && !isStaff(user.role)) {
    throw new HttpError(403, "Only service desk staff can create internal notes.");
  }
}

// Re-export HttpError for convenience
import { HttpError } from "@/lib/http";
export { HttpError };
