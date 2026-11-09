import { z } from "zod";

import { CATEGORY_CODE, PATTERNS, WEAVES } from "@/lib/category-options";
import { firstErrors, optionalText, requiredText } from "./common";

/** "" or one of the choices; blank becomes null. */
const optionalChoice = (choices: readonly string[]) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || choices.includes(v), "กรุณาเลือกจากรายการ")
    .transform((v) => (v === "" ? null : v));

const POSITIVE = "กรุณากรอกตัวเลขมากกว่า 0";

/** Optional number greater than 0, at most `max`, with up to `decimals` decimal places. */
const optionalPositive = (max: number, decimals: number) =>
  z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (v === "") return;
      const n = Number(v);
      if (!/^\d+(\.\d+)?$/.test(v) || !(n > 0)) ctx.addIssue({ code: "custom", message: POSITIVE });
      else if (n > max) ctx.addIssue({ code: "custom", message: `ไม่เกิน ${max.toLocaleString("th-TH")}` });
      else if ((v.split(".")[1]?.length ?? 0) > decimals)
        ctx.addIssue({ code: "custom", message: decimals ? `ทศนิยมได้ไม่เกิน ${decimals} ตำแหน่ง` : "กรุณากรอกจำนวนเต็ม" });
    })
    .transform((v) => (v === "" ? null : Number(v)));

/**
 * The category form schema, shared by the modal and the server actions. Fields and messages
 * from design/src/pages/categories.page.html: name and a three-letter code are required;
 * the fabric details are optional defaults for the category's products.
 */
export const categorySchema = z.object({
  name: requiredText(100, "กรุณากรอกชื่อหมวดหมู่"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .superRefine((v, ctx) => {
      if (v === "") ctx.addIssue({ code: "custom", message: "กรุณากรอกรหัสหมวดหมู่ 3 ตัวอักษร" });
      else if (!CATEGORY_CODE.test(v))
        ctx.addIssue({ code: "custom", message: `รหัสหมวดหมู่ต้องเป็นตัวอักษรอังกฤษ 3 ตัวพอดี (มี ${v.length})` });
    }),
  composition: optionalText(200),
  weave: optionalChoice(WEAVES),
  pattern: optionalChoice(PATTERNS),
  // Stored as DECIMAL(5,1) and INT.
  widthInches: optionalPositive(999, 1),
  gsm: optionalPositive(9999, 0),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type CategoryField = keyof CategoryInput;
export type CategoryErrors = Partial<Record<CategoryField, string>>;

export const CATEGORY_FIELDS: CategoryField[] = ["name", "code", "composition", "weave", "pattern", "widthInches", "gsm"];
export const EMPTY_CATEGORY: CategoryInput = { name: "", code: "", composition: "", weave: "", pattern: "", widthInches: "", gsm: "" };

export const DUPLICATE_CATEGORY_NAME = "มีหมวดหมู่ชื่อนี้แล้ว";
export const duplicateCategoryCode = (code: string) => `รหัส ${code} ใช้กับหมวดหมู่อื่นแล้ว`;
export const categoryCodeLocked = (count: number) => `มีสินค้า ${count} รายการใช้รหัสนี้อยู่ จึงเปลี่ยนรหัสไม่ได้`;

export const categoryErrors = (input: unknown): CategoryErrors => firstErrors<CategoryField>(categorySchema, input, "name");

/** A saved category as form values. */
export function toCategoryInput(c: {
  name: string;
  code: string;
  composition: string | null;
  weave: string | null;
  pattern: string | null;
  widthInches: number | null;
  gsm: number | null;
}): CategoryInput {
  return {
    name: c.name,
    code: c.code,
    composition: c.composition ?? "",
    weave: c.weave ?? "",
    pattern: c.pattern ?? "",
    widthInches: c.widthInches === null ? "" : String(c.widthInches),
    gsm: c.gsm === null ? "" : String(c.gsm),
  };
}
