import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required for the Credentials provider: database sessions do not work with it.
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        // Deleted (soft-deleted) users cannot sign in.
        const user = await db.user.findFirst({ where: { email, deletedAt: null } });
        if (!user) return null;

        const { password: passwordHash, ...safeUser } = user;
        const isValid = await bcrypt.compare(password, passwordHash);
        if (!isValid) return null;

        return { ...safeUser, name: `${user.firstName} ${user.lastName}` };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present at sign-in.
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.signedInAt = Date.now();
        return token;
      }
      // On every later session check (proxy, pages, server actions): the account must
      // still exist and not be soft-deleted. Returning null ends the session, so a user
      // deleted by an admin is signed out on their next request instead of keeping access
      // until the token expires. Their role is refreshed here too.
      // Sessions that signed in before the user's last password change also end, so a
      // changed or reset password signs out every device that knew the old one.
      // If the database can't be reached this throws, and Auth.js treats the session as
      // invalid: failing closed is the safe choice for staff accounts.
      if (!token.id) return null;
      const current = await db.user.findFirst({ where: { id: token.id, deletedAt: null }, select: { role: true, passwordChangedAt: true } });
      if (!current) return null;
      if (current.passwordChangedAt && current.passwordChangedAt.getTime() > (token.signedInAt ?? 0)) return null;
      token.role = current.role;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
