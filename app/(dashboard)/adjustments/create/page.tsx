import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { previewReference } from "@/lib/references";
import AdjustmentForm from "../AdjustmentForm";
import "@/components/form/form.css";
import "../adjustment-form.css";

export const metadata: Metadata = { title: "สร้างรายการปรับปรุงสต็อก" };

const SUBTITLE = "ปรับจำนวนผ้าคงเหลือให้ตรงกับของจริง เช่น หลังตรวจนับ พบผ้าชำรุด หรือตัดเศษปลายม้วน";

async function CreateForm() {
  await connection();
  // Only hides the form; the save action checks the permission again on the server.
  if (!(await can("adjustments.manage"))) return <NoPermission noun="การปรับปรุงสต็อก" />;

  const [warehouses, referencePreview] = await Promise.all([
    db.warehouse.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    previewReference(db, "adjustment", new Date()),
  ]);
  return <AdjustmentForm warehouses={warehouses} referencePreview={referencePreview} />;
}

/** design/src/pages/adjustment.page.html */
export default function CreateAdjustmentPage() {
  return (
    <div className="lts-form lts-adjust-form">
      <FormPageHead title="สร้างรายการปรับปรุงสต็อก" subtitle={SUBTITLE} backHref="/adjustments" />
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </div>
  );
}
