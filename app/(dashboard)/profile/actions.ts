"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deleteAvatar, detectAvatarType, MAX_AVATAR_BYTES, saveAvatar } from "@/lib/avatars";

export type ProfileField = "firstName" | "lastName" | "phoneNumber" | "photo";

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  image: string | null;
};

export type UpdateProfileResult =
  | { status: "success"; profile: ProfileData }
  | { status: "invalid"; errors: Partial<Record<ProfileField, string>> }
  | { status: "signed-out" };

const nameSchema = z.string().trim().min(1).max(100);
const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || (/^[+0-9][0-9\s\-()]*$/.test(v) && v.replace(/\D/g, "").length >= 9));

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  // The user id always comes from the session. Nothing in formData decides whose
  // profile is edited, so a user can only ever change their own record.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { status: "signed-out" };

  // SECURITY: role is deliberately never read here, even if the request contains one.
  // Letting users set their own role would let anyone make themselves admin.
  // Role changes belong on the admin Users page.
  // Email is not editable on the profile page either: it is the sign-in name, so it is
  // never read from formData and never written here.

  const errors: Partial<Record<ProfileField, string>> = {};
  const firstName = nameSchema.safeParse(text(formData, "firstName"));
  const lastName = nameSchema.safeParse(text(formData, "lastName"));
  const phone = phoneSchema.safeParse(text(formData, "phoneNumber"));
  if (!firstName.success) errors.firstName = "กรุณากรอกชื่อ (ไม่เกิน 100 ตัวอักษร)";
  if (!lastName.success) errors.lastName = "กรุณากรอกนามสกุล (ไม่เกิน 100 ตัวอักษร)";
  if (!phone.success) errors.phoneNumber = "เบอร์โทรต้องมีตัวเลขอย่างน้อย 9 หลัก";

  const photo = formData.get("photo");
  let photoBytes: Uint8Array | null = null;
  let photoType: ReturnType<typeof detectAvatarType> = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_AVATAR_BYTES) {
      errors.photo = "ไฟล์ใหญ่เกิน 1 MB";
    } else {
      photoBytes = new Uint8Array(await photo.arrayBuffer());
      photoType = detectAvatarType(photoBytes);
      if (!photoType) errors.photo = "รองรับเฉพาะไฟล์ JPG หรือ PNG";
    }
  }

  if (!firstName.success || !lastName.success || !phone.success || errors.photo) {
    return { status: "invalid", errors };
  }

  const current = await db.user.findFirst({ where: { id: userId, deletedAt: null }, select: { image: true } });
  if (!current) return { status: "signed-out" };

  let image = current.image;
  if (photoBytes && photoType) image = await saveAvatar(photoBytes, photoType);
  else if (formData.get("removePhoto") === "1") image = null;

  let profile: ProfileData;
  try {
    // Only these four fields are written. Email, role and password are never changed here.
    profile = await db.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.data,
        lastName: lastName.data,
        phoneNumber: phone.data || null,
        image,
      },
      select: { firstName: true, lastName: true, email: true, phoneNumber: true, image: true },
    });
  } catch (error) {
    if (image !== current.image) await deleteAvatar(image);
    throw error;
  }

  if (image !== current.image) await deleteAvatar(current.image);

  // Re-renders the layout too, so the top bar shows the new name and photo.
  refresh();
  return { status: "success", profile };
}
