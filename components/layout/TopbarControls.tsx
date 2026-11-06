"use client";

// The interactive pieces of the topbar in design/src/partials/shell_top.html,
// with the vanilla listeners from shell_bottom.html ported to React.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, LogOut, Maximize, Menu, PanelLeft, Search, SlidersHorizontal, User } from "lucide-react";
import { useShell } from "./AppShell";
import { findActive } from "./nav";

export function SidebarToggle() {
  const { collapsed, toggleCollapsed } = useShell();
  const Icon = collapsed ? Menu : PanelLeft;
  return (
    <button
      type="button"
      className="gg-btn gg-btn-ghost icon-only"
      onClick={toggleCollapsed}
      aria-label={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
    >
      <Icon className="gg-icon" aria-hidden />
    </button>
  );
}

/** Breadcrumbs derived from the nav: group › page, or just the page. */
export function Breadcrumbs() {
  const active = findActive(usePathname());
  const crumbs = !active
    ? []
    : active.item.children
      ? [active.item.label, active.link.label]
      : [active.link.label];

  return (
    <nav className="gg-crumbs" aria-label="เส้นทางหน้า">
      {crumbs.map((label, i) => {
        const last = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="gg-icon sm" aria-hidden />}
            {last ? (
              <span className="current" aria-current="page">{label}</span>
            ) : (
              <span>{label}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

/** Global search; "/" focuses it from anywhere outside a form field. */
export function GlobalSearch() {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName ?? "";
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="gg-topbar-search">
      <div className="gg-control">
        <span className="gg-lead">
          <Search className="gg-icon sm" aria-hidden />
        </span>
        <input ref={input} placeholder="ค้นหาผ้า รายการขาย ลูกค้า" aria-label="ค้นหาทั้งระบบ" />
        <span className="gg-kbd">/</span>
      </div>
    </div>
  );
}

export function FullscreenButton() {
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };
  return (
    <button type="button" className="gg-btn gg-btn-ghost icon-only" onClick={toggle} aria-label="เต็มหน้าจอ">
      <Maximize className="gg-icon" aria-hidden />
    </button>
  );
}

/** User dropdown (the design's ActionMenu / wireMenu pattern). */
export function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!anchor.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="gg-menu-anchor" ref={anchor}>
      <button
        type="button"
        className="gg-user"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="gg-avatar">{name.charAt(0).toUpperCase()}</span>
        <span>
          <div className="gg-user-name">{name}</div>
        </span>
        <ChevronDown className="gg-icon sm" aria-hidden />
      </button>
      {open && (
        <div className="gg-menu" role="menu">
          <Link href="/profile" role="menuitem" className="gg-menu-item" onClick={close}>
            <User className="gg-icon sm" aria-hidden />
            โปรไฟล์ของฉัน
          </Link>
          <Link href="/settings" role="menuitem" className="gg-menu-item" onClick={close}>
            <SlidersHorizontal className="gg-icon sm" aria-hidden />
            ตั้งค่า
          </Link>
          <div className="gg-menu-sep" role="separator" />
          <Link href="/login?out=1" role="menuitem" className="gg-menu-item danger" onClick={close}>
            <LogOut className="gg-icon sm" aria-hidden />
            ออกจากระบบ
          </Link>
        </div>
      )}
    </div>
  );
}
