import { z } from "zod";

import { firstErrors, optionalEmail, optionalPhone, optionalText, requiredText, toFormValues } from "./common";

/**
 * The supplier form schema, shared by the client form and the server actions. Same rules
 * as warehouses: only the name is required. Fields and messages follow the suppliers
 * config in design/src/pages/people-form.tpl.html (address instead of zip code, plus an
 * optional tax ID).
 */
export const supplierSchema = z.object({
  name: requiredText(100, "กรุณากรอกชื่อผู้จำหน่าย"),
  email: optionalEmail(),
  phoneNumber: optionalPhone(),
  country: optionalText(60),
  city: optionalText(100),
  address: optionalText(500),
  // 13 digits; spaces and dashes are allowed while typing and removed before saving.
  taxId: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || /^\d{13}$/.test(v), "เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก")
    .transform((v) => (v === "" ? null : v)),
});

export type SupplierInput = z.input<typeof supplierSchema>;
export type SupplierField = keyof SupplierInput;
export type SupplierErrors = Partial<Record<SupplierField, string>>;

export const SUPPLIER_FIELDS: SupplierField[] = ["name", "email", "phoneNumber", "country", "city", "address", "taxId"];
export const EMPTY_SUPPLIER: SupplierInput = { name: "", email: "", phoneNumber: "", country: "ไทย", city: "", address: "", taxId: "" };
export const DUPLICATE_SUPPLIER_NAME = "มีผู้จำหน่ายชื่อนี้อยู่แล้ว";

export const supplierErrors = (input: unknown): SupplierErrors => firstErrors<SupplierField>(supplierSchema, input, "name");
export const toSupplierInput = (s: Record<SupplierField, string | null>): SupplierInput => toFormValues(s, SUPPLIER_FIELDS);
