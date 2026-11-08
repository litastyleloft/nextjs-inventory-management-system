"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { newPasswordSchema } from "@/lib/password-policy";

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

// Results carry only a field name and a message, never a password value.
export type ChangePasswordResult =
  | { status: "success" }
  | { status: "error"; field?: PasswordField; message: string };

const inputSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน",
  });

export async function changePassword(input: unknown): Promise<ChangePasswordResult> {
  // The user id comes only from the session. Nothing in `input` says whose password
  // to change, and any extra keys (userId, role, …) are dropped by the zod schema.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { status: "error", message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", field: issue.path[0] as PasswordField, message: issue.message };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await db.user.findFirst({ where: { id: userId, deletedAt: null }, select: { password: true } });
  if (!user) return { status: "error", message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

  // Nothing changes unless the current password is right.
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return { status: "error", field: "currentPassword", message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    return { status: "error", field: "newPassword", message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน" };
  }

  const password = await bcrypt.hash(newPassword, 12);
  await db.$transaction([
    // passwordChangedAt ends every session signed in before now, including this one.
    db.user.update({ where: { id: userId }, data: { password, passwordChangedAt: new Date() } }),
    // A reset link requested before this change should no longer work.
    db.passwordResetToken.deleteMany({ where: { userId } }),
  ]);

  // Setting passwordChangedAt above ends every session signed in before now, on all
  // devices (checked in the jwt callback in auth.ts). The form then signs this browser
  // out cleanly and asks for the new password.
  return { status: "success" };
}
