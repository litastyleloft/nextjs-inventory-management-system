import { z } from "zod";

/** Building blocks shared by the record schemas (warehouse, supplier, …). */

export const phoneOk = (v: string) => /^[+0-9][0-9\s\-()]*$/.test(v) && v.replace(/\D/g, "").length >= 9;
export const emailOk = (v: string) => z.email().safeParse(v).success;
export const tooLong = (max: number) => `ไม่เกิน ${max} ตัวอักษร`;

/** A required, trimmed name. */
export const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max, tooLong(max));

/** Optional text: blank becomes null; otherwise trimmed and (optionally) format-checked. */
export const optionalText = (max: number, valid?: (v: string) => boolean, message?: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong(max))
    .refine((v) => v === "" || !valid || valid(v), message)
    .transform((v) => (v === "" ? null : v));

export const optionalEmail = () => optionalText(191, emailOk, "รูปแบบอีเมลไม่ถูกต้อง");

/** A required email, trimmed and lower-cased (sign-in emails are compared this way). */
export const requiredEmail = (message = "กรุณากรอกอีเมล") =>
  z.string().trim().toLowerCase().min(1, message).max(191, tooLong(191)).refine(emailOk, "รูปแบบอีเมลไม่ถูกต้อง");
export const optionalPhone = () => optionalText(30, phoneOk, "เบอร์โทรต้องมีตัวเลขอย่างน้อย 9 หลัก");

/** First error message per field, from any schema. */
export function firstErrors<K extends string>(schema: z.ZodType, input: unknown, fallback: K): Partial<Record<K, string>> {
  const result = schema.safeParse(input);
  if (result.success) return {};
  const errors: Partial<Record<K, string>> = {};
  for (const issue of result.error.issues) {
    const field = (issue.path[0] ?? fallback) as K;
    errors[field] ??= issue.message;
  }
  return errors;
}

/** A saved record as form values (null → ""). */
export function toFormValues<K extends string>(record: Record<K, string | null>, fields: readonly K[]): Record<K, string> {
  return Object.fromEntries(fields.map((f) => [f, record[f] ?? ""])) as Record<K, string>;
}
