import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Uploads live outside public/: Next.js only serves public/ files that existed at build
// time, so avatars are served by app/api/avatars/[file]/route.ts instead.
const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
const URL_PREFIX = "/api/avatars/";
const FILE_NAME = /^[0-9a-f-]{36}\.(png|jpg)$/;

export const MAX_AVATAR_BYTES = 1024 * 1024;

export type AvatarType = "png" | "jpg";

/** Identifies the file by its first bytes, not by the name or type the browser sent. */
export function detectAvatarType(bytes: Uint8Array): AvatarType | null {
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

export async function saveAvatar(bytes: Uint8Array, type: AvatarType) {
  await mkdir(AVATAR_DIR, { recursive: true });
  const fileName = `${randomUUID()}.${type}`;
  await writeFile(path.join(AVATAR_DIR, fileName), bytes);
  return URL_PREFIX + fileName;
}

/** Deletes an avatar this app uploaded. Other URLs (or none) are left alone. */
export async function deleteAvatar(url: string | null | undefined) {
  const fileName = url?.startsWith(URL_PREFIX) ? url.slice(URL_PREFIX.length) : null;
  if (!fileName || !FILE_NAME.test(fileName)) return;
  await unlink(path.join(AVATAR_DIR, fileName)).catch(() => {});
}

export async function readAvatar(fileName: string) {
  if (!FILE_NAME.test(fileName)) return null;
  try {
    return {
      bytes: await readFile(path.join(AVATAR_DIR, fileName)),
      contentType: fileName.endsWith(".png") ? "image/png" : "image/jpeg",
    };
  } catch {
    return null;
  }
}
