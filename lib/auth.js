import _CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CredentialsProvider = _CredentialsProvider.default || _CredentialsProvider;

const credentialsSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            orgId: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isActive: true,
            avatarUrl: true,
          },
        });

        if (!user?.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          orgId: user.orgId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.orgId = user.orgId;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.orgId = token.orgId;
      session.user.role = token.role;
      session.user.avatarUrl = token.avatarUrl;
      return session;
    },
  },
};
