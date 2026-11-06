import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

/** The shared shell from design/src/partials (shell_top.html + shell_bottom.html). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Sidebar />
      <div className="gg-shell-main">
        <Topbar />
        <main className="gg-shell-content">{children}</main>
        <Footer />
      </div>
    </AppShell>
  );
}
