"use client";

import { useId, useState } from "react";
import { Upload, X } from "lucide-react";

import { IMAGE_ACCEPT, IMAGE_TOO_BIG, IMAGE_WRONG_TYPE, MAX_IMAGE_BYTES } from "@/lib/upload-limits";
import "./image-list-picker.css";

/** An image already saved on the record. */
export type SavedImage = { id: string; url: string };
/** A newly picked file with its preview (a data: URL, so there is nothing to revoke). */
export type PickedImage = { file: File; preview: string };

type Props = {
  label: string;
  hint: string;
  max: number;
  /** Saved images still kept (edit). Removing one here drops it on save. */
  saved: SavedImage[];
  onSavedChange: (images: SavedImage[]) => void;
  picked: PickedImage[];
  onPickedChange: (images: PickedImage[]) => void;
  disabled?: boolean;
  /** An error from the server's check of the files. */
  serverError?: string;
};

const readPreview = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("unreadable")));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * The design's image field (create-product.page.html: "เลือกไฟล์" control, hint and
 * thumbnails, the first marked "ภาพปก"). Files are added to the selection (up to `max`
 * in total with the saved ones) and each thumbnail can be removed. The order shown is the
 * order saved: saved images first, then new ones; the first is the cover.
 */
export default function ImageListPicker({ label, hint, max, saved, onSavedChange, picked, onPickedChange, disabled, serverError }: Props) {
  const labelId = useId();
  const errorId = useId();
  const [localError, setLocalError] = useState("");
  const error = localError || serverError || "";
  const total = saved.length + picked.length;
  const full = total >= max;

  async function add(files: File[]) {
    const room = max - total;
    const problems: string[] = [];
    const accepted: File[] = [];
    for (const file of files) {
      if (!["image/png", "image/jpeg"].includes(file.type)) problems.push(`${file.name}: ${IMAGE_WRONG_TYPE}`);
      else if (file.size > MAX_IMAGE_BYTES) problems.push(`${file.name}: ${IMAGE_TOO_BIG}`);
      else if (accepted.length >= room) problems.push(`เลือกได้สูงสุด ${max} รูป`);
      else accepted.push(file);
    }
    try {
      const added = await Promise.all(accepted.map(async (file) => ({ file, preview: await readPreview(file) })));
      if (added.length) onPickedChange([...picked, ...added]);
    } catch {
      problems.push("อ่านไฟล์ไม่ได้ กรุณาเลือกใหม่");
    }
    setLocalError([...new Set(problems)].join(" · "));
  }

  const thumbs = [
    ...saved.map((img) => ({ key: `s-${img.id}`, src: img.url, name: "รูปที่บันทึกไว้", remove: () => onSavedChange(saved.filter((x) => x.id !== img.id)) })),
    ...picked.map((img, i) => ({ key: `p-${i}-${img.file.name}`, src: img.preview, name: img.file.name, remove: () => onPickedChange(picked.filter((x) => x !== img)) })),
  ];

  return (
    <div className="gg-field image-list">
      <span className="gg-label" id={labelId}>{label}</span>
      <label className={`gg-control file-control${total ? " has-files" : ""}${error ? " invalid" : ""}${full || disabled ? " disabled" : ""}`} aria-labelledby={labelId}>
        <span className="file-btn"><Upload className="gg-icon sm" aria-hidden />เลือกไฟล์</span>
        <span className="file-name">{total ? `${total} รูป${full ? ` (ครบ ${max} รูปแล้ว)` : ""}` : "ยังไม่ได้เลือกไฟล์"}</span>
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="gg-sr"
          disabled={disabled || full}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = ""; // choosing the same files again still fires change
            if (files.length) void add(files);
          }}
        />
      </label>
      {error ? <div className="gg-error" id={errorId}>{error}</div> : <div className="gg-hint">{hint}</div>}
      {thumbs.length > 0 && (
        <ul className="thumbs" aria-label="รูปที่เลือก">
          {thumbs.map((t, i) => (
            <li key={t.key} className={i === 0 ? "first" : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element -- data: previews and uploaded files */}
              <img src={t.src} alt={i === 0 ? `ภาพปก: ${t.name}` : t.name} />
              <button
                type="button"
                className="thumb-remove"
                aria-label={`นำรูป ${i + 1} ออก`}
                title="นำรูปออก"
                disabled={disabled}
                onClick={() => {
                  setLocalError("");
                  t.remove();
                }}
              >
                <X className="gg-icon sm" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
