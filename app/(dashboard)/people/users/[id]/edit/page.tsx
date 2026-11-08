import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { getUserForEdit, listRoles } from "@/lib/users";
import { updateUser } from "../../actions";
import UserForm from "../../UserForm";
import "@/components/form/form.css";

export const metadata: Metadata = { title: "แก้ไขผู้ใช้งาน" };

const SUBTITLE = "สร้างบัญชีให้พนักงานเข้าใช้ระบบตามบทบาทที่กำหนด";
const LIST_PATH = "/people/users";

type Params = Promise<{ id: string }>;

async function EditForm({ params }: { params: Params }) {
  await connection();
  // Staff details are only loaded for users allowed to manage them.
  if (!(await can("users.manage"))) {
    return (
      <>
        <FormPageHead title="แก้ไขผู้ใช้งาน" subtitle={SUBTITLE} backHref={LIST_PATH} />
        <NoPermission noun="ผู้ใช้งาน" />
      </>
    );
  }

  const { id } = await params;
  // getUserForEdit skips deleted users and never selects the password hash.
  const [user, roles, session] = await Promise.all([getUserForEdit(id), listRoles(), auth()]);
  if (!user) notFound();

  const { image, updatedAt, ...values } = user;
  return (
    <>
      {/* Matches the design: "แก้ไข" + noun + the user's name. */}
      <FormPageHead title={`แก้ไขผู้ใช้งาน ${user.firstName} ${user.lastName}`} subtitle={SUBTITLE} backHref={LIST_PATH} />
      <UserForm
        // A newer save (here or elsewhere) remounts the form with fresh values.
        key={updatedAt.toISOString()}
        mode="edit"
        roles={roles}
        initial={{ ...values, phoneNumber: values.phoneNumber ?? "" }}
        initialImage={image}
        roleLocked={user.id === session?.user?.id}
        action={updateUser.bind(null, user.id)}
      />
    </>
  );
}

/** The create form in edit mode: the same UserForm, pre-filled, passwords optional. */
export default function EditUserPage({ params }: { params: Params }) {
  return (
    <div className="lts-form">
      <Suspense fallback={<FormPageHead title="แก้ไขผู้ใช้งาน" subtitle={SUBTITLE} backHref={LIST_PATH} />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}
