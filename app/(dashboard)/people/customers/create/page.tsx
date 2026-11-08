import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { can } from "@/lib/permissions";
import { createCustomer } from "../actions";
import CustomerForm from "../CustomerForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "เพิ่มลูกค้า" };

const SUBTITLE = "ข้อมูลติดต่อและเงื่อนไขเครดิตของลูกค้า ใช้ในการขายและใบวางบิล";

async function CreateForm() {
  await connection();
  // Only hides the form; createCustomer checks the permission again on the server.
  if (!(await can("customers.manage"))) return <NoPermission noun="ลูกค้า" />;
  return <CustomerForm mode="create" action={createCustomer} />;
}

export default function CreateCustomerPage() {
  return (
    <div className="lts-form">
      <FormPageHead title="เพิ่มลูกค้า" subtitle={SUBTITLE} backHref="/people/customers" />
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </div>
  );
}
