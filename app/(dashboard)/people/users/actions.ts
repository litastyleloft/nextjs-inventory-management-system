"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";

import type { DeleteRecordResult } from "@/components/list/DeleteRecordButton";
import { deleteAvatar, readAvatarUpload, saveAvatar } from "@/lib/avatars";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { ADMIN_ROLE, CANNOT_DELETE_SELF, isLastActiveAdmin, LAST_ADMIN_MESSAGE, notDeleted } from "@/lib/users";
import {
  EMAIL_TAKEN,
  EMAIL_TAKEN_BY_DELETED,
  USER_TEXT_FIELDS,
  userErrors,
  userSchema,
  type UserErrors,
} from "@/lib/validation/user";

/** Results carry field names and messages only: never a password or its hash. */
export type UserActionResult =
  | { status: "success"; id: string; name: string }
  | { status: "invalid"; errors: UserErrors }
  | { status: "not-found" | "forbidden" | "signed-out" };

const LIST_PATH = "/people/users";

function readText(formData: FormData) {
  return Object.fromEntries(
    USER_TEXT_FIELDS.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );
}

/** Email is unique across all users, including deleted ones (the database enforces it). */
async function emailProblem(email: string, exceptId?: string) {
  const owner = await db.user.findUnique({ where: { email }, select: { id: true, deletedAt: true } });
  if (!owner || owner.id === exceptId) return null;
  return owner.deletedAt ? EMAIL_TAKEN_BY_DELETED : EMAIL_TAKEN;
}

export async function createUser(formData: FormData): Promise<UserActionResult> {
  // 1. Permission first (Manage Users = admins), read from the session and database.
  const access = await requirePermission("users.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate every field with the shared schema (password required on create).
  const input = readText(formData);
  const parsed = userSchema("create").safeParse(input);
  const errors: UserErrors = parsed.success ? {} : userErrors("create", input);
  const photo = await readAvatarUpload(formData.get("photo"));
  if (photo && "error" in photo) errors.photo = photo.error;
  if (!parsed.success || errors.photo) return { status: "invalid", errors };
  const data = parsed.data;

  // 3. The role must be one of the roles in the Role table.
  const role = await db.role.findUnique({ where: { id: data.role }, select: { id: true } });
  if (!role) return { status: "invalid", errors: { role: "กรุณาเลือกบทบาท" } };

  const taken = await emailProblem(data.email);
  if (taken) return { status: "invalid", errors: { email: taken } };

  // 4. Only the bcrypt hash is stored; the plain password goes no further than this line.
  const passwordHash = await bcrypt.hash(data.password, 12);
  const image = photo && "bytes" in photo ? await saveAvatar(photo.bytes, photo.type) : null;

  try {
    const user = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        password: passwordHash,
        image,
      },
      select: { id: true, firstName: true, lastName: true },
    });
    revalidatePath(LIST_PATH);
    return { status: "success", id: user.id, name: `${user.firstName} ${user.lastName}` };
  } catch (error) {
    await deleteAvatar(image);
    // Someone took the email between the check above and this insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "invalid", errors: { email: EMAIL_TAKEN } };
    }
    throw error;
  }
}

const idSchema = z.string().trim().min(1).max(50);

/**
 * Bound to the user's id on the edit page (`updateUser.bind(null, id)`). The bound id
 * travels through the browser, so it is validated and must belong to an active user.
 *
 * Differences from create:
 * - Password is optional: blank keeps the current hash; a new one is validated, hashed
 *   and saved. The existing password is never read into the form.
 * - Your own role can't be changed here (the request's role is ignored for yourself).
 * - The last active admin can't be given another role.
 */
export async function updateUser(rawId: unknown, formData: FormData): Promise<UserActionResult> {
  const access = await requirePermission("users.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const current = await db.user.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true, role: true, image: true } });
  if (!current) return { status: "not-found" };

  const input = readText(formData);
  const parsed = userSchema("edit").safeParse(input);
  const errors: UserErrors = parsed.success ? {} : userErrors("edit", input);
  const photo = await readAvatarUpload(formData.get("photo"));
  if (photo && "error" in photo) errors.photo = photo.error;
  if (!parsed.success || errors.photo) return { status: "invalid", errors };
  const data = parsed.data;

  // Role: the signed-in user's own role is never changed here (compared with the
  // session id, not anything the browser sent).
  const isSelf = current.id === access.userId;
  const role = isSelf ? current.role : data.role;
  if (role !== current.role) {
    const exists = await db.role.findUnique({ where: { id: role }, select: { id: true } });
    if (!exists) return { status: "invalid", errors: { role: "กรุณาเลือกบทบาท" } };
    if (await isLastActiveAdmin(current.id)) return { status: "invalid", errors: { role: LAST_ADMIN_MESSAGE } };
  }

  const taken = await emailProblem(data.email, current.id);
  if (taken) return { status: "invalid", errors: { email: taken } };

  // Password: only when a new one was entered. Blank keeps the existing hash untouched.
  const password = data.password ? await bcrypt.hash(data.password, 12) : undefined;

  let image = current.image;
  if (photo && "bytes" in photo) image = await saveAvatar(photo.bytes, photo.type);
  else if (formData.get("removePhoto") === "1") image = null;

  try {
    // `deletedAt: null` in the update itself, so a user deleted meanwhile is not changed.
    const { count } = await db.user.updateMany({
      where: { id: current.id, ...notDeleted },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role,
        image,
        // A new password also ends that user's existing sessions (passwordChangedAt).
        ...(password ? { password, passwordChangedAt: new Date() } : {}),
      },
    });
    if (count === 0) {
      if (image !== current.image) await deleteAvatar(image);
      return { status: "not-found" };
    }
  } catch (error) {
    if (image !== current.image) await deleteAvatar(image);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "invalid", errors: { email: EMAIL_TAKEN } };
    }
    throw error;
  }
  if (image !== current.image) await deleteAvatar(current.image);

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${current.id}/edit`);
  // Editing yourself changes the top bar's name and photo, so refresh the layout too.
  if (isSelf) refresh();
  return { status: "success", id: current.id, name: `${data.firstName} ${data.lastName}` };
}

/**
 * Soft delete (sets deletedAt). A deleted user can no longer sign in, and their open
 * sessions end on their next request (see the jwt callback in auth.ts).
 *
 * Guards, after the permission check and a valid id for an active user:
 * - You can't delete your own account (compared with the session user id).
 * - The last active admin can't be deleted. The admin rows are locked for the check, so
 *   two admins deleting each other at the same moment can't leave the system with none.
 */
export async function deleteUser(rawId: unknown): Promise<DeleteRecordResult> {
  const access = await requirePermission("users.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const user = await db.user.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true, firstName: true, lastName: true, role: true } });
  if (!user) return { status: "not-found" };

  if (user.id === access.userId) return { status: "blocked", message: CANNOT_DELETE_SELF };
  if (await isLastActiveAdmin(user.id)) return { status: "blocked", message: LAST_ADMIN_MESSAGE };

  const outcome = await db.$transaction(async (tx) => {
    if (user.role === ADMIN_ROLE) {
      // Lock every active admin row until this transaction ends, then re-check.
      const admins = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM \`User\` WHERE role = ${ADMIN_ROLE} AND deletedAt IS NULL FOR UPDATE`;
      if (!admins.some((a) => a.id !== user.id)) return "last-admin" as const;
    }
    const { count } = await tx.user.updateMany({ where: { id: user.id, ...notDeleted }, data: { deletedAt: new Date() } });
    if (count === 0) return "not-found" as const;
    // Unused password-reset links for this account are no longer needed.
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    return "deleted" as const;
  });

  if (outcome === "last-admin") return { status: "blocked", message: LAST_ADMIN_MESSAGE };
  if (outcome === "not-found") return { status: "not-found" };

  revalidatePath(LIST_PATH);
  return { status: "success", name: `${user.firstName} ${user.lastName}` };
}
