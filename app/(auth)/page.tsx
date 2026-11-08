import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

// With cacheComponents on, reading the session must sit inside a Suspense boundary,
// and connection() defers it to request time because auth() uses random values.
// The form itself stays in the static shell.
async function RedirectIfSignedIn() {
  await connection();
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return null;
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <LoginForm />
    </>
  );
}
