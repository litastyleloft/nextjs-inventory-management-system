import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import ChangePasswordForm from "./ChangePasswordForm";
import "./change-password.css";

export const metadata: Metadata = { title: "เปลี่ยนรหัสผ่าน" };

// The email is only used as the form's hidden username for password managers.
async function Form() {
  await connection();
  const session = await auth();
  return <ChangePasswordForm email={session?.user?.email ?? ""} />;
}

/** No design yet: uses the card, field and button classes from the create-user design. */
export default function ChangePasswordPage() {
  return (
    <div className="lts-change-password">
      <div className="gg-pagehead">
        <div>
          <h1 className="gg-pagehead-title">เปลี่ยนรหัสผ่าน</h1>
          <p className="gg-pagehead-sub">ยืนยันรหัสผ่านปัจจุบัน แล้วตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
        </div>
        <div className="gg-pagehead-actions">
          <Link className="gg-btn gg-btn-secondary" href="/dashboard">
            <ChevronLeft className="gg-icon sm" aria-hidden />
            ย้อนกลับ
          </Link>
        </div>
      </div>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </div>
  );
}
