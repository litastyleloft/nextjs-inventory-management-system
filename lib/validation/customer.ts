import { z } from "zod";

import { isProvinceOption } from "@/lib/thai-provinces";
import { firstErrors, optionalEmail, optionalPhone, optionalText, requiredText } from "./common";

/**
 * The customer form schema, shared by the client form and the server actions. Name and
 * province are required; everything else is optional. Fields and messages follow the
 * customers config in design/src/pages/people-form.tpl.html.
 */

/** Credit terms in days; 0 = cash (the design's default). */
export const CREDIT_TERMS = [0, 7, 15, 30, 60, 90, 120, 180, 360] as const;
export const creditTermLabel = (days: number) => (days === 0 ? "เงินสด / ชำระทันที" : `เครดิต ${days} วัน`);

/** Today's date in Bangkok as YYYY-MM-DD (the same on the server and in the browser). */
export const todayInBangkok = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

/** A real calendar date in YYYY-MM-DD form (rejects e.g. 2024-02-30). */
const isRealDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export const customerSchema = z.object({
  name: requiredText(100, "กรุณากรอกชื่อลูกค้า"),
  email: optionalEmail(),
  phoneNumber: optionalPhone(),
  // Arrives as "YYYY-MM-DD" from <input type="date"> and is saved as a real Date at UTC
  // midnight, which the DATE column stores as exactly that day.
  dateOfBirth: z
    .string()
    .trim()
    .refine((v) => v === "" || isRealDate(v), "วันเกิดไม่ถูกต้อง")
    .refine((v) => v === "" || !isRealDate(v) || v >= "1900-01-01", "วันเกิดไม่ถูกต้อง")
    .refine((v) => v === "" || !isRealDate(v) || v <= todayInBangkok(), "วันเกิดต้องไม่เป็นวันในอนาคต")
    .transform((v) => (v === "" ? null : new Date(`${v}T00:00:00.000Z`))),
  country: optionalText(60),
  city: z.string().trim().refine(isProvinceOption, "กรุณาเลือกจังหวัด"),
  address: optionalText(500),
  creditTermDays: z
    .string()
    .trim()
    .refine((v) => (CREDIT_TERMS as readonly number[]).includes(Number(v)) && v !== "", "กรุณาเลือกเครดิตเริ่มต้น")
    .transform(Number),
});

/** What the form holds: every field as text. */
export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerField = keyof CustomerInput;
export type CustomerErrors = Partial<Record<CustomerField, string>>;

export const CUSTOMER_FIELDS: CustomerField[] = ["name", "email", "phoneNumber", "dateOfBirth", "country", "city", "address", "creditTermDays"];
export const EMPTY_CUSTOMER: CustomerInput = { name: "", email: "", phoneNumber: "", dateOfBirth: "", country: "ไทย", city: "", address: "", creditTermDays: "0" };
export const DUPLICATE_CUSTOMER_NAME = "มีลูกค้าชื่อนี้อยู่แล้ว";

export const customerErrors = (input: unknown): CustomerErrors => firstErrors<CustomerField>(customerSchema, input, "name");

/**
 * A saved customer as form values. The DATE column comes back as a Date at UTC midnight,
 * so the day is read in UTC; reading it in local time is the classic off-by-one bug.
 */
export function toCustomerInput(c: {
  name: string;
  email: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  city: string;
  address: string | null;
  creditTermDays: number;
}): CustomerInput {
  return {
    name: c.name,
    email: c.email ?? "",
    phoneNumber: c.phoneNumber ?? "",
    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString().slice(0, 10) : "",
    country: c.country ?? "",
    city: c.city,
    address: c.address ?? "",
    creditTermDays: String(c.creditTermDays),
  };
}
