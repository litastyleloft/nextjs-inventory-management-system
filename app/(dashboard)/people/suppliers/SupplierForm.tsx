"use client";

import RecordForm, { type RecordActionResult, type RecordField } from "@/components/form/RecordForm";
import { EMPTY_SUPPLIER, supplierErrors, type SupplierField, type SupplierInput } from "@/lib/validation/supplier";

// The suppliers config from design/src/pages/people-form.tpl.html. Only the name is
// required (same as warehouses); the tax ID is optional with the design's hint.
const FIELDS: RecordField<SupplierField>[] = [
  { id: "name", label: "ชื่อผู้จำหน่าย", placeholder: "กรอกชื่อผู้จำหน่าย", required: true },
  { id: "email", label: "อีเมล", placeholder: "กรอกอีเมล", type: "email" },
  { id: "phoneNumber", label: "เบอร์โทรศัพท์", placeholder: "เช่น 081-234-5678", type: "tel" },
  { id: "country", label: "ประเทศ", placeholder: "กรอกประเทศ" },
  { id: "city", label: "เมือง / จังหวัด", placeholder: "กรอกเมืองหรือจังหวัด" },
  { id: "address", label: "ที่อยู่", placeholder: "กรอกที่อยู่" },
  { id: "taxId", label: "เลขประจำตัวผู้เสียภาษี", placeholder: "13 หลัก", inputMode: "numeric", hint: "ใช้ออกเอกสารภาษีซื้อ" },
];

type Props = {
  mode: "create" | "edit";
  initial?: SupplierInput;
  action: (input: SupplierInput) => Promise<RecordActionResult<SupplierField>>;
};

/** design/html/lts-create-supplier.html: the shared RecordForm with the supplier fields. */
export default function SupplierForm({ mode, initial = EMPTY_SUPPLIER, action }: Props) {
  return (
    <RecordForm
      mode={mode}
      fields={FIELDS}
      initial={initial}
      empty={EMPTY_SUPPLIER}
      validate={supplierErrors}
      action={action}
      listHref="/people/suppliers"
      noun="ผู้จำหน่าย"
    />
  );
}
