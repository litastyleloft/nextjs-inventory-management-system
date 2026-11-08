import { z } from "zod";

import { firstErrors, optionalEmail, optionalPhone, optionalText, requiredText, toFormValues } from "./common";

/**
 * One schema for the warehouse form, used by the client form (live field errors) and by
 * the server actions (the real check). Only the name is required; every other field is
 * optional, and its format is checked only when something is entered. Messages follow
 * design/src/pages/people-form.tpl.html.
 */
export const warehouseSchema = z
  .object({
    name: requiredText(100, "กรุณากรอกชื่อคลังสินค้า"),
    email: optionalEmail(),
    phoneNumber: optionalPhone(),
    country: optionalText(60),
    city: optionalText(100),
    zipCode: optionalText(10),
  })
  .superRefine((data, ctx) => {
    if (!data.zipCode) return;
    if (data.country === "ไทย" ? !/^\d{5}$/.test(data.zipCode) : !/^[A-Za-z0-9 -]{3,10}$/.test(data.zipCode)) {
      const message = data.country === "ไทย" ? "รหัสไปรษณีย์ไทยต้องเป็นตัวเลข 5 หลัก" : "รหัสไปรษณีย์ไม่ถูกต้อง";
      ctx.addIssue({ code: "custom", path: ["zipCode"], message });
    }
  });

/** What the form holds: every field as text ("" for blank). */
export type WarehouseInput = z.input<typeof warehouseSchema>;
export type WarehouseField = keyof WarehouseInput;
export type WarehouseErrors = Partial<Record<WarehouseField, string>>;

export const WAREHOUSE_FIELDS: WarehouseField[] = ["name", "email", "phoneNumber", "country", "city", "zipCode"];
export const EMPTY_WAREHOUSE: WarehouseInput = { name: "", email: "", phoneNumber: "", country: "ไทย", city: "", zipCode: "" };
export const DUPLICATE_WAREHOUSE_NAME = "มีคลังสินค้าชื่อนี้อยู่แล้ว";

export const warehouseErrors = (input: unknown): WarehouseErrors => firstErrors<WarehouseField>(warehouseSchema, input, "name");
export const toWarehouseInput = (w: Record<WarehouseField, string | null>): WarehouseInput => toFormValues(w, WAREHOUSE_FIELDS);
