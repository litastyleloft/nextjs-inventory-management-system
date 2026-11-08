import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { can } from "@/lib/permissions";
import { listRoles } from "@/lib/users";
import { createUser } from "../actions";
import UserForm from "../UserForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "เพิ่มผู้ใช้งาน" };

const SUBTITLE = "สร้างบัญชีให้พนักงานเข้าใช้ระบบตามบทบาทที่กำหนด";

async function CreateForm() {
  await connection();
  // Only hides the form; createUser checks the permission again on the server.
  if (!(await can("users.manage"))) return <NoPermission noun="ผู้ใช้งาน" />;
  // Role options come from the Role table, not the design's hard-coded list.
  const roles = await listRoles();
  return <UserForm mode="create" roles={roles} action={createUser} />;
}

export default function CreateUserPage() {
  return (
    <div className="lts-form">
      <FormPageHead title="เพิ่มผู้ใช้งาน" subtitle={SUBTITLE} backHref="/people/users" />
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </div>
  );
}
