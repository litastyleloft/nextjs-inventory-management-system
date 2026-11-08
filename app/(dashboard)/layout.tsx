import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

// Second auth layer, behind proxy.ts. The shell and page are rendered inside this
// check so that none of their content can reach the prerendered HTML.
async function AuthenticatedShell({ children }: { children: ReactNode }) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/");

  // Read from the database rather than the sign-in token, so profile edits show at once.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, image: true },
  });
  const userName = user ? `${user.firstName} ${user.lastName}` : (session.user.name ?? session.user.email ?? "");

  return (
    <AppShell>
      <Sidebar />
      <div className="gg-shell-main">
        <Topbar userName={userName} userImage={user?.image ?? null} />
        <main className="gg-shell-content">{children}</main>
        <Footer />
      </div>
    </AppShell>
  );
}

/** The shared shell from design/src/partials (shell_top.html + shell_bottom.html). */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
