"use client";

import RecordForm, { type ComputedField, type RecordActionResult, type RecordField } from "@/components/form/RecordForm";
import { CalendarClock } from "lucide-react";

import { BILLING_DAY, billingDateFor, creditMonths, CREDIT_TERMS, creditTermLabel, isCreditTerm, thaiMonth } from "@/lib/credit-terms";
import { ABROAD, PROVINCE_LIST, regionOf } from "@/lib/thai-provinces";
import { EMPTY_CUSTOMER, customerErrors, type CustomerField, type CustomerInput } from "@/lib/validation/customer";

// The customers config from design/src/pages/people-form.tpl.html, without email and
// birthday. Name and province are required; the region box is worked out from the
// province and is not saved.
const FIELDS: (RecordField<CustomerField> | ComputedField<CustomerField>)[] = [
  { id: "name", label: "ชื่อลูกค้า", placeholder: "กรอกชื่อลูกค้าหรือชื่อร้าน", required: true },
  { id: "phoneNumber", label: "เบอร์โทรศัพท์", placeholder: "เช่น 081-234-5678", type: "tel" },
  { id: "country", label: "ประเทศ", placeholder: "กรอกประเทศ" },
  {
    id: "city",
    label: "จังหวัด",
    kind: "select",
    required: true,
    placeholder: "เลือกจังหวัด",
    options: [...PROVINCE_LIST.map((p) => ({ value: p, label: p })), { value: ABROAD, label: "ต่างประเทศ (นอกประเทศไทย)" }],
  },
  {
    kind: "computed",
    key: "region",
    label: "ภูมิภาค",
    note: "(อัตโนมัติจากจังหวัด · การแบ่ง 6 ภาค)",
    compute: (v) => {
      const region = regionOf(v.city, v.country);
      if (!region) return { empty: v.city ? "ไม่พบจังหวัดนี้" : "เลือกจังหวัดก่อน" };
      return { value: region, hint: region === ABROAD ? "ลูกค้าต่างประเทศ" : `จากจังหวัด ${v.city} · ใช้ในรายงานภูมิภาคขายดีบนแดชบอร์ด` };
    },
  },
  { id: "address", label: "ที่อยู่", kind: "textarea", placeholder: "กรอกที่อยู่สำหรับจัดส่งและออกใบกำกับภาษี" },
  {
    id: "creditTerm",
    label: "เครดิตเริ่มต้น",
    kind: "select",
    options: CREDIT_TERMS.map((t) => ({ value: t, label: creditTermLabel(t) })),
    hint: "ใช้เป็นค่าเริ่มต้นตอนขายเชื่อ ปรับได้ในแต่ละบิลขาย",
  },
  {
    // Explains the billing rule in lib/credit-terms.ts with a fixed example month (January),
    // so it renders the same on the server and in the browser.
    kind: "computed",
    key: "billingCycle",
    label: "รอบวางบิล",
    note: "(ตามเครดิตเริ่มต้น)",
    icon: CalendarClock,
    compute: (v) => {
      if (!isCreditTerm(v.creditTerm)) return { empty: "เลือกเครดิตเริ่มต้นก่อน" };
      const months = creditMonths(v.creditTerm);
      if (months === 0) return { value: "ชำระทันทีเมื่อซื้อ", hint: "ไม่มีการวางบิลภายหลัง" };
      // Uses the real rule on an example purchase in January.
      const bill = billingDateFor("2000-01-15", v.creditTerm);
      const nextYear = bill.startsWith("2001") ? " ปีถัดไป" : "";
      return {
        value: `วางบิลวันที่ ${BILLING_DAY} ของเดือนที่ ${months} ถัดจากเดือนที่ซื้อ`,
        hint: `เช่น ซื้อวันใดก็ได้ในเดือน ม.ค. → วางบิล ${BILLING_DAY} ${thaiMonth(Number(bill.slice(5, 7)))}${nextYear}`,
      };
    },
  },
];

type Props = {
  mode: "create" | "edit";
  initial?: CustomerInput;
  action: (input: CustomerInput) => Promise<RecordActionResult<CustomerField>>;
};

/** design/html/lts-create-customer.html: the shared RecordForm with the customer fields. */
export default function CustomerForm({ mode, initial = EMPTY_CUSTOMER, action }: Props) {
  return (
    <RecordForm
      mode={mode}
      fields={FIELDS}
      initial={initial}
      empty={EMPTY_CUSTOMER}
      validate={customerErrors}
      action={action}
      listHref="/people/customers"
      noun="ลูกค้า"
    />
  );
}
