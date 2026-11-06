import { Suspense } from "react";
import Dashboard from "./Dashboard";
import "./dashboard.css";

export const metadata = { title: "แดชบอร์ด" };

/**
 * design/html/lts-dashboard.html. Sidebar, topbar and footer come from
 * app/(dashboard)/layout.tsx (components/layout); this is only the
 * <main class="gg-shell-content"> part.
 */
export default function DashboardPage() {
  return (
    // The dashboard reads today's date, so it renders per request; the
    // static shell shows just the page heading until it streams in.
    <Suspense
      fallback={
        <div className="lts-dashboard">
          <div className="gg-pagehead"><div><h1 className="gg-pagehead-title">แดชบอร์ด</h1></div></div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
