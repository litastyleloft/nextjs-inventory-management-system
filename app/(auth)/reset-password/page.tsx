import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { findValidResetToken } from "@/lib/password-reset";
import ResetPasswordForm, { InvalidResetLink } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "ตั้งรหัสผ่านใหม่",
  // The URL holds the reset token, so it must not be sent to other sites.
  referrer: "no-referrer",
};

type SearchParams = Promise<{ token?: string | string[] }>;

async function ResetCard({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const { token } = await searchParams;
  if (typeof token !== "string" || !(await findValidResetToken(token))) {
    return <InvalidResetLink />;
  }
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={null}>
      <ResetCard searchParams={searchParams} />
    </Suspense>
  );
}
