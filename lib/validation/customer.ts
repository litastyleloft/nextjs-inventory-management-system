import { z } from "zod";

import { isCreditTerm } from "@/lib/credit-terms";
import { isProvinceOption } from "@/lib/thai-provinces";
import { firstErrors, optionalPhone, optionalText, requiredText } from "./common";

/**
 * The customer form schema, shared by the client form and the server actions. Name and
 * province are required; everything else is optional. Fields and messages follow the
 * customers config in design/src/pages/people-form.tpl.html (without email and birthday).
 */

// Credit terms (cash, or 1–12 months) and the billing-date rule live in lib/credit-terms.ts.

export const customerSchema = z.object({
  name: requiredText(100, "กรุณากรอกชื่อลูกค้า"),
  phoneNumber: optionalPhone(),
  country: optionalText(60),
  city: z.string().trim().refine(isProvinceOption, "กรุณาเลือกจังหวัด"),
  address: optionalText(500),
  creditTerm: z
    .string()
    .trim()
    .refine(isCreditTerm, "กรุณาเลือกเครดิตเริ่มต้น"),
});

/** What the form holds: every field as text. */
export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerField = keyof CustomerInput;
export type CustomerErrors = Partial<Record<CustomerField, string>>;

export const CUSTOMER_FIELDS: CustomerField[] = ["name", "phoneNumber", "country", "city", "address", "creditTerm"];
export const EMPTY_CUSTOMER: CustomerInput = { name: "", phoneNumber: "", country: "ไทย", city: "", address: "", creditTerm: "cash" };
export const DUPLICATE_CUSTOMER_NAME = "มีลูกค้าชื่อนี้อยู่แล้ว";

export const customerErrors = (input: unknown): CustomerErrors => firstErrors<CustomerField>(customerSchema, input, "name");

/** A saved customer as form values (null → ""). */
export function toCustomerInput(c: {
  name: string;
  phoneNumber: string | null;
  country: string | null;
  city: string;
  address: string | null;
  creditTerm: string;
}): CustomerInput {
  return {
    name: c.name,
    phoneNumber: c.phoneNumber ?? "",
    country: c.country ?? "",
    city: c.city,
    address: c.address ?? "",
    creditTerm: c.creditTerm,
  };
}
