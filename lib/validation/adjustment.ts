import { z } from "zod";

import { ADJUSTMENT_REASONS } from "@/lib/adjustment-options";
import { optionalText } from "./common";

/** Today in Bangkok as "YYYY-MM-DD" (the default and the latest allowed date). */
export const todayInBangkok = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

/** A positive quantity with up to 2 decimals, at most 10 digits before the point. */
export const QUANTITY = /^\d{1,10}(\.\d{1,2})?$/;
export const quantityProblem = (v: string) =>
  !v.trim() ? "กรุณากรอกจำนวน" : !QUANTITY.test(v.trim()) || !(Number(v) > 0) ? "กรุณากรอกจำนวนมากกว่า 0 (ทศนิยมไม่เกิน 2 ตำแหน่ง)" : "";

export const adjustmentItemSchema = z.object({
  productId: z.string().trim().min(1).max(50),
  quantity: z.string().trim().refine((v) => !quantityProblem(v), "กรุณากรอกจำนวนมากกว่า 0 (ทศนิยมไม่เกิน 2 ตำแหน่ง)"),
  type: z.enum(["ADDITION", "SUBTRACTION"], "กรุณาเลือกประเภทการปรับ"),
});

/**
 * A whole adjustment, shared by the form and the save action. Messages from
 * design/src/pages/adjustment.page.html. Stock limits (a subtraction can't take more than
 * the warehouse holds) are checked against the database when saving.
 */
export const adjustmentSchema = z.object({
  warehouseId: z.string().trim().min(1, "กรุณาเลือกคลังสินค้า").max(50, "กรุณาเลือกคลังสินค้า"),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "กรุณาเลือกวันที่")
    .refine((v) => v <= todayInBangkok(), "วันที่ต้องไม่เกินวันนี้"),
  reason: z.enum(ADJUSTMENT_REASONS, "กรุณาเลือกเหตุผลการปรับปรุง"),
  notes: optionalText(1000),
  items: z
    .array(adjustmentItemSchema)
    .min(1, "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ")
    .max(200, "เพิ่มได้ไม่เกิน 200 รายการต่อเอกสาร")
    .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, "มีสินค้าซ้ำกันในรายการ"),
});

export type AdjustmentInput = z.input<typeof adjustmentSchema>;
export type AdjustmentHeaderField = "warehouseId" | "date" | "reason" | "notes" | "items";
export type AdjustmentErrors = Partial<Record<AdjustmentHeaderField, string>> & {
  /** Per-line problems, keyed by product id. */
  lines?: Record<string, string>;
};

/** Header errors from the schema (line errors are worked out per row by the form/server). */
export function adjustmentHeaderErrors(input: unknown): AdjustmentErrors {
  const result = adjustmentSchema.safeParse(input);
  if (result.success) return {};
  const errors: AdjustmentErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as AdjustmentHeaderField;
    if (field === "items" && issue.path.length > 1) continue; // a line's own problem
    errors[field] ??= issue.message;
  }
  return errors;
}
