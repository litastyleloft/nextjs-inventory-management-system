"use server";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { after } from "next/server";

import { emailSchema } from "@/auth";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { newPasswordSchema } from "@/lib/password-policy";
import { findValidResetToken, hashResetToken } from "@/lib/password-reset";

const TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

async function issueResetEmail(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;

  const recent = await db.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return;

  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
      },
    }),
  ]);

  // Built from AUTH_URL, never the request's Host header, which a caller can forge.
  const resetUrl = new URL("/reset-password", process.env.AUTH_URL);
  resetUrl.searchParams.set("token", token);
  await sendPasswordResetEmail(user.email, resetUrl.href);
}

export async function requestPasswordReset(rawEmail: string) {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return;

  // Runs after the response, so response time does not reveal whether an account exists.
  after(async () => {
    try {
      await issueResetEmail(parsed.data);
    } catch (error) {
      console.error("Could not send the password reset email:", error);
    }
  });
}

export type ResetPasswordResult = { status: "success" | "invalid-link" | "weak-password" };

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  if (!newPasswordSchema.safeParse(newPassword).success) return { status: "weak-password" };
  if (!(await findValidResetToken(token))) return { status: "invalid-link" };

  const password = await bcrypt.hash(newPassword, 12);

  const changed = await db.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findFirst({
      where: { tokenHash: hashResetToken(token), expiresAt: { gt: new Date() } },
    });
    if (!record) return false;

    // Only one of two simultaneous requests can delete the row, so a link works once.
    const { count } = await tx.passwordResetToken.deleteMany({ where: { id: record.id } });
    if (count !== 1) return false;

    await tx.user.update({ where: { id: record.userId }, data: { password } });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
    return true;
  });

  return { status: changed ? "success" : "invalid-link" };
}
