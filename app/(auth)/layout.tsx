import type { ReactNode } from "react";

import "./login.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-brand">
        <div className="gg-brand-mark" aria-hidden="true">L</div>
        <div className="nm">LTS <b>Solution</b></div>
        <div className="tag">ระบบค้าส่งผ้า · สินค้าคงคลังและ POS</div>
      </div>
      {children}
      <div className="auth-foot">© 2026 LTS Solution สงวนลิขสิทธิ์</div>
    </div>
  );
}
