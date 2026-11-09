"use client";

import { useId, useState } from "react";
import { ImageIcon, Pencil } from "lucide-react";

import { IMAGE_ACCEPT, IMAGE_TOO_BIG, IMAGE_WRONG_TYPE, MAX_IMAGE_BYTES } from "@/lib/upload-limits";
import "./logo-picker.css";

type Props = {
  label: string;
  /** Text inside the empty box, e.g. "เลือกรูปผ้าตัวอย่าง". */
  placeholder: string;
  /** The saved image, shown until a new file is picked. */
  currentUrl: string | null;
  /** The newly picked file (null = keep the current image). */
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  /** An error from the server's check of the file (shown until another file is picked). */
  serverError?: string;
};

/**
 * The design's square image picker (.logo-pick in categories.page.html): click the box to
 * choose a JPG/PNG, see a preview, and a pen badge to change it. The file is only sent on
 * save; the server checks it again by content.
 */
export default function LogoPicker({ label, placeholder, currentUrl, file, onChange, disabled, serverError }: Props) {
  const labelId = useId();
  const errorId = useId();
  const [localError, setError] = useState("");
  const error = localError || serverError || "";
  // Preview of the picked file as a data: URL (no blob URL to revoke later).
  const [preview, setPreview] = useState<string | null>(null);
  const shown = (file && preview) || currentUrl;

  function pick(picked: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(typeof reader.result === "string" ? reader.result : null);
      onChange(picked);
    };
    reader.onerror = () => setError("อ่านไฟล์ไม่ได้ กรุณาเลือกใหม่");
    reader.readAsDataURL(picked);
  }

  return (
    <div>
      <div className="gg-label logo-label" id={labelId}>{label}</div>
      <label className={`logo-pick${error ? " invalid" : ""}`} aria-labelledby={labelId}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview or an uploaded file
          <img src={shown} alt="" />
        ) : (
          <span className="ph">
            <ImageIcon className="gg-icon lg" aria-hidden />
            {placeholder}
          </span>
        )}
        <span className="pen" aria-hidden="true"><Pencil className="gg-icon sm" /></span>
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          className="gg-sr"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            const picked = e.target.files?.[0];
            e.target.value = ""; // picking the same file again still fires change
            if (!picked) return;
            if (!["image/png", "image/jpeg"].includes(picked.type)) return setError(IMAGE_WRONG_TYPE);
            if (picked.size > MAX_IMAGE_BYTES) return setError(IMAGE_TOO_BIG);
            setError("");
            pick(picked);
          }}
        />
      </label>
      {error ? <div className="gg-error" id={errorId}>{error}</div> : <div className="gg-hint">JPG หรือ PNG ไม่เกิน 1 MB</div>}
    </div>
  );
}
