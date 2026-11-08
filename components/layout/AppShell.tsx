"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

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
      {/* Toasts for the signed-in app, styled with the design's tokens. */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            font: "500 14px/20px var(--font-sans)",
            color: "var(--ink)",
            background: "var(--surface)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-2)",
            padding: "10px 14px",
          },
          success: { iconTheme: { primary: "var(--success)", secondary: "var(--surface)" } },
          error: { duration: 5000, iconTheme: { primary: "var(--danger)", secondary: "var(--surface)" } },
        }}
      />
    </ShellContext>
  );
}
