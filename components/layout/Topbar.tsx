import Link from "next/link";
import { Bell, ScanBarcode } from "lucide-react";
import { Breadcrumbs, FullscreenButton, GlobalSearch, SidebarToggle, UserMenu } from "./TopbarControls";

/** The header from design/src/partials/shell_top.html. */
export default function Topbar({ userName, userImage }: { userName: string; userImage: string | null }) {
  return (
    <header className="gg-topbar">
      <SidebarToggle />
      <Breadcrumbs />
      <GlobalSearch />
      <div className="gg-topbar-end">
        <Link href="/pos" className="gg-btn gg-btn-gold gg-pos">
          <ScanBarcode className="gg-icon" aria-hidden />
          POS
        </Link>
        <FullscreenButton />
        <span className="gg-iconbtn-wrap">
          <button type="button" className="gg-btn gg-btn-ghost icon-only" aria-label="การแจ้งเตือน">
            <Bell className="gg-icon" aria-hidden />
          </button>
        </span>
        <span className="gg-divider-v" aria-hidden="true" />
        <UserMenu name={userName} image={userImage} />
      </div>
    </header>
  );
}
