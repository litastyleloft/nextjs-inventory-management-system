"use client";

import toast from "react-hot-toast";
import { Upload } from "lucide-react";

/** Placeholder until CSV import is built: tells the user instead of doing nothing. */
export default function ImportSuppliersButton() {
  return (
    <button
      type="button"
      className="gg-btn gg-btn-secondary"
      onClick={() => toast("การนำเข้าผู้จำหน่ายจากไฟล์ CSV จะเปิดให้ใช้เร็ว ๆ นี้", { id: "import-suppliers", icon: "ℹ️" })}
    >
      <Upload className="gg-icon" aria-hidden />
      นำเข้าผู้จำหน่าย
    </button>
  );
}
