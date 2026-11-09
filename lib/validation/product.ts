import { z } from "zod";

import { PRODUCT_CODE } from "@/lib/product-code";
import { firstErrors, optionalText, requiredText } from "./common";

export const BARCODE_TYPES = [
  { value: "CODE128", label: "Code 128" },
  { value: "CODE39", label: "Code 39" },
] as const;

/**
 * A decimal quantity in yards with up to 2 decimal places (DECIMAL(12,2)). Kept as a string
 * so Prisma stores it exactly; never turned into a float.
 */
const quantity = (message: string, { allowZero }: { allowZero: boolean }) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{1,10}(\.\d{1,2})?$/.test(v) && (allowZero || Number(v) > 0)), message);

/**
 * The product fields shared by create and edit. Fields and messages from
 * design/src/pages/create-product.page.html. The code arrives whole (the form builds it
 * from the category code and its four segments); the server also checks that its first
 * three letters are the chosen category's code.
 */
const productFields = {
  name: requiredText(200, "กรุณากรอกชื่อสินค้า"),
  categoryId: z.string().trim().min(1, "กรุณาเลือกหมวดหมู่สินค้า").max(50, "กรุณาเลือกหมวดหมู่สินค้า"),
  // The product's main supplier (required; checked against active suppliers on the server).
  supplierId: z.string().trim().min(1, "กรุณาเลือกผู้จำหน่าย").max(50, "กรุณาเลือกผู้จำหน่าย"),
  code: z.string().trim().toUpperCase().regex(PRODUCT_CODE, "รูปแบบรหัสไม่ถูกต้อง"),
  colorName: optionalText(100),
  barcodeType: z.enum(["CODE128", "CODE39"], "กรุณาเลือกประเภทบาร์โค้ด"),
  // Blank means 0, as in the design (the field starts at 0).
  stockAlert: quantity("กรุณากรอกตัวเลขตั้งแต่ 0 ขึ้นไป (ทศนิยมไม่เกิน 2 ตำแหน่ง)", { allowZero: true }).transform((v) => v || "0"),
  notes: optionalText(1000),
};

export const productSchema = z.object(productFields);

/**
 * Create only: the optional initial stock (design: "สต็อกเริ่มต้น"). It becomes one
 * ProductStock row for the chosen warehouse. A quantity needs a warehouse; a warehouse
 * without a quantity adds nothing.
 */
export const createProductSchema = z
  .object({
    ...productFields,
    warehouseId: z.string().trim().max(50),
    initialQuantity: quantity("กรุณากรอกจำนวนหลามากกว่า 0 (ทศนิยมไม่เกิน 2 ตำแหน่ง)", { allowZero: false }),
  })
  .refine((v) => !v.initialQuantity || v.warehouseId, { path: ["warehouseId"], message: "เลือกคลังที่เก็บผ้านี้" });

export type ProductInput = z.input<typeof productSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
export type ProductField = keyof CreateProductInput;
export type ProductErrors = Partial<Record<ProductField | "images", string>>;

export const PRODUCT_FIELDS = Object.keys(productFields) as (keyof ProductInput)[];
export const CREATE_PRODUCT_FIELDS: ProductField[] = [...PRODUCT_FIELDS, "warehouseId", "initialQuantity"];

export const productErrors = (input: unknown): ProductErrors => firstErrors<ProductField>(productSchema, input, "name");
export const createProductErrors = (input: unknown): ProductErrors => firstErrors<ProductField>(createProductSchema, input, "name");
