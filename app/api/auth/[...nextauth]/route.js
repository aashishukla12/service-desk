import _NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const NextAuth = _NextAuth.default || _NextAuth;
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
