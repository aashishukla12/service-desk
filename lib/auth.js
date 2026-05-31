import _CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "@/lib/db";

const CredentialsProvider = _CredentialsProvider.default || _CredentialsProvider;

const credentialsSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128)
});

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60
  },
  pages: {
    signIn: "/sign-in"
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const result = await pool.query(
          `
            SELECT id, org_id, name, email, password_hash, role, is_active
            FROM users
            WHERE email = $1
            LIMIT 1
          `,
          [email.toLowerCase()]
        );

        const user = result.rows[0];

        if (!user?.is_active) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: String(user.id),
          orgId: user.org_id === null ? null : String(user.org_id),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.orgId = user.orgId;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.orgId = token.orgId;
      session.user.role = token.role;
      return session;
    }
  }
};
