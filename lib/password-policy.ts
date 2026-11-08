import { z } from "zod";

/** The rule from the create-user design, shared by password reset and change password. */
export const PASSWORD_RULE = "อย่างน้อย 8 ตัว และต้องมีทั้งตัวอักษรและตัวเลข";

export const newPasswordSchema = z
  .string()
  .min(8, PASSWORD_RULE)
  .regex(/[A-Za-z]/, PASSWORD_RULE)
  .regex(/\d/, PASSWORD_RULE)
  // bcrypt ignores everything after 72 bytes.
  .refine((value) => Buffer.byteLength(value) <= 72, "รหัสผ่านยาวเกินไป");
