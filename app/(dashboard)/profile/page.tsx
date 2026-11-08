import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import ProfileForm from "./ProfileForm";
import "./profile.css";

export const metadata: Metadata = { title: "โปรไฟล์ของฉัน" };

async function Profile() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // Only the signed-in user's own record, and never the password.
  const user = await db.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { firstName: true, lastName: true, email: true, phoneNumber: true, image: true, roleRef: { select: { name: true } } },
  });
  if (!user) notFound();

  const { roleRef, ...profile } = user;
  const roleName = roleRef.name;
  return <ProfileForm profile={{ ...profile, phoneNumber: profile.phoneNumber ?? "" }} roleName={roleName} />;
}

/** Based on design/src/pages/people-form.tpl.html (users), adapted to edit your own profile. */
export default function ProfilePage() {
  return (
    <div className="lts-profile">
      <div className="gg-pagehead">
        <div>
          <h1 className="gg-pagehead-title">โปรไฟล์ของฉัน</h1>
          <p className="gg-pagehead-sub">แก้ไขชื่อ อีเมล เบอร์โทร และรูปโปรไฟล์ของคุณ</p>
        </div>
        <div className="gg-pagehead-actions">
          <Link className="gg-btn gg-btn-secondary" href="/dashboard">
            <ChevronLeft className="gg-icon sm" aria-hidden />
            ย้อนกลับ
          </Link>
        </div>
      </div>
      <Suspense fallback={null}>
        <Profile />
      </Suspense>
    </div>
  );
}
