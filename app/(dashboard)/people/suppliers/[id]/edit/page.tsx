import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { can } from "@/lib/permissions";
import { getSupplier } from "@/lib/suppliers";
import { toSupplierInput } from "@/lib/validation/supplier";
import { updateSupplier } from "../../actions";
import SupplierForm from "../../SupplierForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "แก้ไขผู้จำหน่าย" };

const SUBTITLE = "ข้อมูลติดต่อโรงทอหรือผู้ค้าผ้า ใช้ในใบสั่งซื้อและใบคืนสินค้า";
const LIST_PATH = "/people/suppliers";

type Params = Promise<{ id: string }>;

async function EditForm({ params }: { params: Params }) {
  await connection();
  const { id } = await params;

  // getSupplier skips deleted suppliers, so a deleted one is "not found" here too.
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const canManage = await can("suppliers.manage");
  return (
    <>
      {/* Matches the design: "แก้ไข" + noun + the record's name. */}
      <FormPageHead title={`แก้ไขผู้จำหน่าย ${supplier.name}`} subtitle={SUBTITLE} backHref={LIST_PATH} />
      {canManage ? (
        <SupplierForm
          // A newer save (here or elsewhere) remounts the form with fresh values.
          key={supplier.updatedAt.toISOString()}
          mode="edit"
          initial={toSupplierInput(supplier)}
          action={updateSupplier.bind(null, supplier.id)}
        />
      ) : (
        <NoPermission noun="ผู้จำหน่าย" />
      )}
    </>
  );
}

/** The create form in edit mode: the same SupplierForm component, pre-filled. */
export default function EditSupplierPage({ params }: { params: Params }) {
  return (
    <div className="lts-form">
      <Suspense fallback={<FormPageHead title="แก้ไขผู้จำหน่าย" subtitle={SUBTITLE} backHref={LIST_PATH} />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}
