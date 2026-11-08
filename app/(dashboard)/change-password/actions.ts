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

  const user = await db.user.findUnique({ where: { id: userId }, select: { password: true } });
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
    db.user.update({ where: { id: userId }, data: { password } }),
    // A reset link requested before this change should no longer work.
    db.passwordResetToken.deleteMany({ where: { userId } }),
  ]);

  // Possible enhancement (not implemented yet): sign the user out here, and end their
  // sessions on other devices, so everyone signs in again with the new password.
  // JWT sessions cannot be revoked on their own, so this needs a per-user
  // "sessions valid after" timestamp checked in the auth callbacks.
  return { status: "success" };
}
