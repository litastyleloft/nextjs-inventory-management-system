import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { can } from "@/lib/permissions";
import { toWarehouseInput } from "@/lib/validation/warehouse";
import { getWarehouse } from "@/lib/warehouses";
import { updateWarehouse } from "../../actions";
import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import WarehouseForm from "../../WarehouseForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "แก้ไขคลังสินค้า" };

const SUBTITLE = "คลังหรือหน้าร้านที่เก็บผ้า ใช้ในการซื้อ ขาย และโอนย้ายสินค้า";

type Params = Promise<{ id: string }>;

async function EditForm({ params }: { params: Params }) {
  await connection();
  const { id } = await params;

  // getWarehouse skips deleted warehouses, so a deleted one is "not found" here too.
  const warehouse = await getWarehouse(id);
  if (!warehouse) notFound();

  const canManage = await can("warehouses.manage");
  return (
    <>
      {/* Matches the design: "แก้ไข" + noun + the record's name. */}
      <FormPageHead title={`แก้ไขคลังสินค้า ${warehouse.name}`} subtitle={SUBTITLE} backHref="/warehouse" />
      {canManage ? (
        <WarehouseForm
          // A newer save (here or elsewhere) remounts the form with fresh values.
          key={warehouse.updatedAt.toISOString()}
          mode="edit"
          initial={toWarehouseInput(warehouse)}
          action={updateWarehouse.bind(null, warehouse.id)}
        />
      ) : (
        <NoPermission noun="คลังสินค้า" />
      )}
    </>
  );
}

/** The create form in edit mode: the same WarehouseForm component, pre-filled. */
export default function EditWarehousePage({ params }: { params: Params }) {
  return (
    <div className="lts-form">
      <Suspense fallback={<FormPageHead title="แก้ไขคลังสินค้า" subtitle={SUBTITLE} backHref="/warehouse" />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}
