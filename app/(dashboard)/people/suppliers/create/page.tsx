import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { can } from "@/lib/permissions";
import { createSupplier } from "../actions";
import SupplierForm from "../SupplierForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "เพิ่มผู้จำหน่าย" };

const SUBTITLE = "ข้อมูลติดต่อโรงทอหรือผู้ค้าผ้า ใช้ในใบสั่งซื้อและใบคืนสินค้า";

async function CreateForm() {
  await connection();
  // Only hides the form; createSupplier checks the permission again on the server.
  if (!(await can("suppliers.manage"))) return <NoPermission noun="ผู้จำหน่าย" />;
  return <SupplierForm mode="create" action={createSupplier} />;
}

export default function CreateSupplierPage() {
  return (
    <div className="lts-form">
      <FormPageHead title="เพิ่มผู้จำหน่าย" subtitle={SUBTITLE} backHref="/people/suppliers" />
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </div>
  );
}
