import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/sign-in", "/api/auth", "/help"];

function isPublicPath(pathname) {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-id", token.id);
  response.headers.set("x-org-id", token.orgId || "");
  response.headers.set("x-user-role", token.role || "");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
