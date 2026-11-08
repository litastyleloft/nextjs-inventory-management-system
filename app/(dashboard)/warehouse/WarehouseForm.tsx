"use client";

import RecordForm, { type RecordActionResult, type RecordField } from "@/components/form/RecordForm";
import { EMPTY_WAREHOUSE, warehouseErrors, type WarehouseField, type WarehouseInput } from "@/lib/validation/warehouse";

// Only the name is required; the others show the design's "(ไม่บังคับ)" label.
const FIELDS: RecordField<WarehouseField>[] = [
  { id: "name", label: "ชื่อคลังสินค้า", placeholder: "เช่น คลังบางนา", required: true },
  { id: "email", label: "อีเมล", placeholder: "กรอกอีเมล", type: "email" },
  { id: "phoneNumber", label: "เบอร์โทรศัพท์", placeholder: "เช่น 081-234-5678", type: "tel" },
  { id: "country", label: "ประเทศ", placeholder: "กรอกประเทศ" },
  { id: "city", label: "เมือง / จังหวัด", placeholder: "กรอกเมืองหรือจังหวัด" },
  { id: "zipCode", label: "รหัสไปรษณีย์", placeholder: "กรอกรหัสไปรษณีย์", inputMode: "numeric" },
];

type Props = {
  mode: "create" | "edit";
  initial?: WarehouseInput;
  action: (input: WarehouseInput) => Promise<RecordActionResult<WarehouseField>>;
};

/** design/html/lts-create-warehouse.html: the shared RecordForm with the warehouse fields. */
export default function WarehouseForm({ mode, initial = EMPTY_WAREHOUSE, action }: Props) {
  return (
    <RecordForm
      mode={mode}
      fields={FIELDS}
      initial={initial}
      empty={EMPTY_WAREHOUSE}
      validate={warehouseErrors}
      action={action}
      listHref="/warehouse"
      noun="คลังสินค้า"
    />
  );
}
