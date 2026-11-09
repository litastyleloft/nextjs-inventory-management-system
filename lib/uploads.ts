import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { IMAGE_TOO_BIG, IMAGE_WRONG_TYPE, MAX_IMAGE_BYTES } from "@/lib/upload-limits";

/**
 * Images uploaded for master-data records (category pictures now; brands etc. later).
 * Same approach as lib/avatars.ts: files live outside public/ under uploads/<kind>/ with
 * random names, and are served by app/api/uploads/[kind]/[file]/route.ts to signed-in
 * users. To add a kind, add it to KINDS.
 */
const KINDS = ["categories", "products"] as const;
export type UploadKind = (typeof KINDS)[number];
export const isUploadKind = (v: string): v is UploadKind => (KINDS as readonly string[]).includes(v);

const ROOT = path.join(process.cwd(), "uploads");
const FILE_NAME = /^[0-9a-f-]{36}\.(png|jpg)$/;
const urlPrefix = (kind: UploadKind) => `/api/uploads/${kind}/`;

type ImageType = "png" | "jpg";

/** Identifies the file by its first bytes, not by the name or type the browser sent. */
function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

/**
 * Checks an image from a form: null when none was chosen, an error message when it is
 * too big or not really a JPG/PNG (checked by content), otherwise its bytes and type.
 */
export async function readImageUpload(
  value: FormDataEntryValue | null,
): Promise<null | { error: string } | { bytes: Uint8Array; type: ImageType }> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_IMAGE_BYTES) return { error: IMAGE_TOO_BIG };
  const bytes = new Uint8Array(await value.arrayBuffer());
  const type = detectImageType(bytes);
  return type ? { bytes, type } : { error: IMAGE_WRONG_TYPE };
}

/** Saves an image and returns its URL. */
export async function saveUpload(kind: UploadKind, bytes: Uint8Array, type: ImageType) {
  const dir = path.join(ROOT, kind);
  await mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.${type}`;
  await writeFile(path.join(dir, fileName), bytes);
  return urlPrefix(kind) + fileName;
}

/** Deletes an image this app uploaded for `kind`. Other URLs (or none) are left alone. */
export async function deleteUpload(kind: UploadKind, url: string | null | undefined) {
  const prefix = urlPrefix(kind);
  const fileName = url?.startsWith(prefix) ? url.slice(prefix.length) : null;
  if (!fileName || !FILE_NAME.test(fileName)) return;
  await unlink(path.join(ROOT, kind, fileName)).catch(() => {});
}

export async function readUpload(kind: UploadKind, fileName: string) {
  if (!FILE_NAME.test(fileName)) return null;
  try {
    return {
      bytes: await readFile(path.join(ROOT, kind, fileName)),
      contentType: fileName.endsWith(".png") ? "image/png" : "image/jpeg",
    };
  } catch {
    return null;
  }
}
