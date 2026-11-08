"use client";

import toast from "react-hot-toast";
import { Upload } from "lucide-react";

/**
 * Placeholder for a toolbar action that isn't built yet (e.g. CSV import): it tells the
 * user instead of doing nothing, so there is never a dead button.
 */
export default function ComingSoonButton({ label, message }: { label: string; message: string }) {
  return (
    <button type="button" className="gg-btn gg-btn-secondary" onClick={() => toast(message, { id: `soon-${label}`, icon: "ℹ️" })}>
      <Upload className="gg-icon" aria-hidden />
      {label}
    </button>
  );
}
