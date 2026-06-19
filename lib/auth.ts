import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { db } from "./db";

const credentialsSchema = z.object({
  phone: z.string().regex(/^\+?7\d{10}$/),
  password: z.string().min(1),
});

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Телефон" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { phone: parsed.data.phone },
        });
        if (!user || !user.passwordHash) return null;
        // /admin/login is the admin entry point; cashiers will get their own
        // /kassa/login + provider in a future session. For now, only admins.
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
          return null;
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? user.phone ?? undefined,
          role: user.role,
          phone: user.phone ?? "",
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h shift
  pages: { signIn: "/admin/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: UserRole }).role;
        token.phone = (user as { phone: string }).phone;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
});
