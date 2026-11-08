import { z } from "zod";

/** The rule from the create-user design, shared by password reset, change password and users. */
export const PASSWORD_RULE = "อย่างน้อย 8 ตัว และต้องมีทั้งตัวอักษรและตัวเลข";
export const PASSWORD_MIN_LENGTH = 8;

/** UTF-8 byte length; works on the server and in the browser (unlike Buffer). */
const byteLength = (value: string) => new TextEncoder().encode(value).length;

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_RULE)
  .regex(/[A-Za-z]/, PASSWORD_RULE)
  .regex(/\d/, PASSWORD_RULE)
  // bcrypt ignores everything after 72 bytes.
  .refine((value) => byteLength(value) <= 72, "รหัสผ่านยาวเกินไป");

/** The design's 4-step strength meter (people-form.tpl.html `strength`): 0 = empty. */
export function passwordStrength(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (p.length >= 12) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(1, s) as 1 | 2 | 3 | 4;
}
