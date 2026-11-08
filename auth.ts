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
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const { password: passwordHash, ...safeUser } = user;
        const isValid = await bcrypt.compare(password, passwordHash);
        if (!isValid) return null;

        return { ...safeUser, name: `${user.firstName} ${user.lastName}` };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present at sign-in; later requests reuse the token's values.
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
