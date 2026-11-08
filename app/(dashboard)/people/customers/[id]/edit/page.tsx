import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Lock } from "lucide-react";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { DIRECT_CUSTOMER_KEY, getCustomer } from "@/lib/customers";
import { can } from "@/lib/permissions";
import { toCustomerInput } from "@/lib/validation/customer";
import { updateCustomer } from "../../actions";
import CustomerForm from "../../CustomerForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "แก้ไขลูกค้า" };

const SUBTITLE = "ข้อมูลติดต่อและเงื่อนไขเครดิตของลูกค้า ใช้ในการขายและใบวางบิล";
const LIST_PATH = "/people/customers";

type Params = Promise<{ id: string }>;

async function EditForm({ params }: { params: Params }) {
  await connection();
  const { id } = await params;

  // getCustomer skips deleted customers, so a deleted one is "not found" here too.
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const canManage = await can("customers.manage");
  return (
    <>
      {/* Matches the design: "แก้ไข" + noun + the record's name. */}
      <FormPageHead title={`แก้ไขลูกค้า ${customer.name}`} subtitle={SUBTITLE} backHref={LIST_PATH} />
      {customer.systemKey === DIRECT_CUSTOMER_KEY && (
        // Editable (name, phone, …), but its systemKey is not a form field, so it stays the
        // default, and it can never be deleted.
        <div className="alert-default" role="note">
          <Lock className="gg-icon sm" aria-hidden />
          <span>นี่คือลูกค้าเริ่มต้นของ POS (ใช้เมื่อไม่ได้เลือกลูกค้า) แก้ไขข้อมูลได้ แต่ลบไม่ได้</span>
        </div>
      )}
      {canManage ? (
        <CustomerForm
          // A newer save (here or elsewhere) remounts the form with fresh values.
          key={customer.updatedAt.toISOString()}
          mode="edit"
          // toCustomerInput turns the DATE column into "YYYY-MM-DD" using UTC, so the
          // date field shows the stored day whatever the server's time zone is.
          initial={toCustomerInput(customer)}
          action={updateCustomer.bind(null, customer.id)}
        />
      ) : (
        <NoPermission noun="ลูกค้า" />
      )}
    </>
  );
}

/** The create form in edit mode: the same CustomerForm component, pre-filled. */
export default function EditCustomerPage({ params }: { params: Params }) {
  return (
    <div className="lts-form">
      <Suspense fallback={<FormPageHead title="แก้ไขลูกค้า" subtitle={SUBTITLE} backHref={LIST_PATH} />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}
