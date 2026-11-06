"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ShellState = { collapsed: boolean; toggleCollapsed: () => void };

const ShellContext = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <AppShell>");
  return ctx;
}

/**
 * The design's <div class="gg gg-shell">. Holds the sidebar-collapsed state
 * shared by the sidebar (.gg-sidebar.collapsed) and the topbar toggle button.
 * Server children pass straight through.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <ShellContext value={{ collapsed, toggleCollapsed }}>
      <div className="gg gg-shell">{children}</div>
    </ShellContext>
  );
}
