"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useShell } from "./AppShell";
import { NAV, findActive, isSection, type NavItem } from "./nav";

/** React port of the sidebar in design/src/partials/shell_bottom.html (renderNav). */
export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useShell();
  const active = findActive(pathname);
  const activeKey = active?.link.key;

  // Groups the user has explicitly opened/closed. Untouched groups start open
  // when they contain the current page, like the design's initial `open` map.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isOpen = (item: NavItem) => toggled[item.key] ?? active?.item.key === item.key;

  return (
    <aside className={collapsed ? "gg-sidebar collapsed" : "gg-sidebar"} aria-label="เมนูหลัก">
      <div className="gg-brand">
        <div className="gg-brand-mark">L</div>
        <div className="gg-brand-name">
          LTS <b>Solution</b>
        </div>
      </div>

      <nav className="gg-nav">
        {NAV.map((entry) => {
          if (isSection(entry)) {
            return (
              <div key={entry.section} className="gg-nav-label">
                {entry.section}
              </div>
            );
          }

          const Icon = entry.icon;
          const title = collapsed ? entry.label : undefined;

          if (!entry.children) {
            const current = entry.key === activeKey;
            return (
              <Link
                key={entry.key}
                href={entry.href}
                className={current ? "gg-nav-item active" : "gg-nav-item"}
                aria-current={current ? "page" : undefined}
                title={title}
              >
                <Icon className="gg-icon" aria-hidden />
                <span className="gg-nav-text">{entry.label}</span>
              </Link>
            );
          }

          const open = isOpen(entry);
          const childActive = entry.children.some((c) => c.key === activeKey);
          const cls = ["gg-nav-item", childActive && "child-active", childActive && open && "open-parent"]
            .filter(Boolean)
            .join(" ");
          const head = (
            <>
              <Icon className="gg-icon" aria-hidden />
              <span className="gg-nav-text">{entry.label}</span>
              <ChevronRight className="gg-icon sm gg-chev" aria-hidden />
            </>
          );

          return (
            <Fragment key={entry.key}>
              {collapsed ? (
                // Collapsed rail hides sub-menus, so the group jumps to its first page.
                <Link href={entry.children[0].href} className={cls} title={title} aria-expanded={open}>
                  {head}
                </Link>
              ) : (
                <button
                  type="button"
                  className={cls}
                  aria-expanded={open}
                  onClick={() => setToggled((t) => ({ ...t, [entry.key]: !open }))}
                >
                  {head}
                </button>
              )}
              {open && !collapsed && (
                <div className="gg-subnav">
                  {entry.children.map((child) => {
                    const current = child.key === activeKey;
                    return (
                      <Link
                        key={child.key}
                        href={child.href}
                        className={current ? "gg-nav-item active" : "gg-nav-item"}
                        aria-current={current ? "page" : undefined}
                      >
                        <span className="gg-nav-text">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
