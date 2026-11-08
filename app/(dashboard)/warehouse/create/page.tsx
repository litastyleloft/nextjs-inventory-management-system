import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { can } from "@/lib/permissions";
import { createWarehouse } from "../actions";
import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import WarehouseForm from "../WarehouseForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "เพิ่มคลังสินค้า" };

const SUBTITLE = "คลังหรือหน้าร้านที่เก็บผ้า ใช้ในการซื้อ ขาย และโอนย้ายสินค้า";

async function CreateForm() {
  await connection();
  // Only hides the form; createWarehouse checks the permission again on the server.
  if (!(await can("warehouses.manage"))) return <NoPermission noun="คลังสินค้า" />;
  return <WarehouseForm mode="create" action={createWarehouse} />;
}

export default function CreateWarehousePage() {
  return (
    <div className="lts-form">
      <FormPageHead title="เพิ่มคลังสินค้า" subtitle={SUBTITLE} backHref="/warehouse" />
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </div>
  );
}
