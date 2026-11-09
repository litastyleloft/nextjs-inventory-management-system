"use client";

import toast from "react-hot-toast";
import { Download, Upload } from "lucide-react";

// By name: a server component can't pass an icon component to a client component.
const ICONS = { upload: Upload, download: Download };

/**
 * Placeholder for a toolbar action that isn't built yet (e.g. CSV import): it tells the
 * user instead of doing nothing, so there is never a dead button.
 */
export default function ComingSoonButton({ label, message, icon = "upload" }: { label: string; message: string; icon?: keyof typeof ICONS }) {
  const Icon = ICONS[icon];
  return (
    <button type="button" className="gg-btn gg-btn-secondary" onClick={() => toast(message, { id: `soon-${label}`, icon: "ℹ️" })}>
      <Icon className="gg-icon" aria-hidden />
      {label}
    </button>
  );
}
