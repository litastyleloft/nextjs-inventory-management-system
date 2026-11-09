"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { DeleteRecordResult } from "@/components/list/DeleteRecordButton";
import { categoryDeleteBlocker, categoryProductCount, notDeleted } from "@/lib/categories";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { deleteUpload, readImageUpload, saveUpload } from "@/lib/uploads";
import {
  CATEGORY_FIELDS,
  DUPLICATE_CATEGORY_NAME,
  categoryCodeLocked,
  categoryErrors,
  categorySchema,
  duplicateCategoryCode,
  type CategoryField,
} from "@/lib/validation/category";

export type CategoryFormField = CategoryField | "image";

export type CategoryActionResult =
  | { status: "success"; id: string; name: string }
  | { status: "invalid"; errors: Partial<Record<CategoryFormField, string>> }
  | { status: "busy" }
  | { status: "not-found" | "forbidden" | "signed-out" };

const LIST_PATH = "/products/categories";

/** The text fields from the modal's FormData. Anything else (id, deletedAt, …) is ignored. */
function readText(formData: FormData) {
  return Object.fromEntries(
    CATEGORY_FIELDS.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );
}

/** Validates the text fields and the optional image. */
async function readForm(formData: FormData) {
  const input = readText(formData);
  const parsed = categorySchema.safeParse(input);
  const errors: Partial<Record<CategoryFormField, string>> = parsed.success ? {} : categoryErrors(input);
  const image = await readImageUpload(formData.get("image"));
  if (image && "error" in image) errors.image = image.error;
  if (!parsed.success || errors.image) return { ok: false as const, errors };
  return { ok: true as const, data: parsed.data, image: image && "bytes" in image ? image : null };
}

type Tx = Prisma.TransactionClient;

/**
 * Name and code must be unique among active categories (case-insensitive by the
 * database collation). MySQL has no partial unique index, so this runs inside the
 * SERIALIZABLE transaction that also writes: two saves racing for the same name or code
 * can't both pass, and the loser gets a "busy" result instead of a duplicate.
 */
async function duplicates(tx: Tx, name: string, code: string, exceptId?: string) {
  const clash = await tx.category.findMany({
    where: { ...notDeleted, OR: [{ name }, { code }], ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { name: true, code: true },
  });
  const errors: Partial<Record<CategoryFormField, string>> = {};
  if (clash.some((c) => c.name.toLowerCase() === name.toLowerCase())) errors.name = DUPLICATE_CATEGORY_NAME;
  if (clash.some((c) => c.code.toUpperCase() === code)) errors.code = duplicateCategoryCode(code);
  return Object.keys(errors).length ? errors : null;
}

const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

/** A write that lost a race (deadlock / serialization failure): safe to try again. */
const isWriteConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

export async function createCategory(formData: FormData): Promise<CategoryActionResult> {
  // 1. Permission first, read from the session and database, never from the client.
  const access = await requirePermission("categories.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate with the same schema the modal uses, plus the image by its content.
  const form = await readForm(formData);
  if (!form.ok) return { status: "invalid", errors: form.errors };
  const { data } = form;

  // 3. Save the file first so the row never points at a missing file; removed again
  //    below if the row isn't created.
  const image = form.image ? await saveUpload("categories", form.image.bytes, form.image.type) : null;
  try {
    const result = await db.$transaction(async (tx) => {
      const errors = await duplicates(tx, data.name, data.code);
      if (errors) return { status: "invalid", errors } as const;
      const created = await tx.category.create({ data: { ...data, image }, select: { id: true, name: true } });
      return { status: "success", ...created } as const;
    }, SERIALIZABLE);

    if (result.status !== "success") await deleteUpload("categories", image);
    else revalidatePath(LIST_PATH);
    return result;
  } catch (error) {
    await deleteUpload("categories", image);
    if (isWriteConflict(error)) return { status: "busy" };
    throw error;
  }
}

const idSchema = z.string().trim().min(1).max(50);

/**
 * Edit, from the same modal. The id is sent by the browser, so it is untrusted: it is
 * validated and must belong to an active category before anything else happens.
 * No new image → the current one stays. A new image replaces it, and the old file is
 * removed once the change is saved.
 */
export async function updateCategory(rawId: unknown, formData: FormData): Promise<CategoryActionResult> {
  const access = await requirePermission("categories.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const existing = await db.category.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true } });
  if (!existing) return { status: "not-found" };

  const form = await readForm(formData);
  if (!form.ok) return { status: "invalid", errors: form.errors };
  const { data } = form;

  const newImage = form.image ? await saveUpload("categories", form.image.bytes, form.image.type) : null;
  try {
    const result = await db.$transaction(async (tx) => {
      // Re-read inside the transaction: it may have been deleted or edited meanwhile.
      const current = await tx.category.findFirst({ where: { id: id.data, ...notDeleted }, select: { code: true, image: true } });
      if (!current) return { status: "not-found" } as const;

      // The code is part of every product code, so it can't change once products use it.
      if (data.code !== current.code) {
        const products = await categoryProductCount(id.data, tx);
        if (products > 0) return { status: "invalid", errors: { code: categoryCodeLocked(products) } } as const;
      }
      const errors = await duplicates(tx, data.name, data.code, id.data);
      if (errors) return { status: "invalid", errors } as const;

      await tx.category.update({ where: { id: id.data }, data: { ...data, ...(newImage ? { image: newImage } : {}) } });
      return { status: "success", id: id.data, name: data.name, oldImage: newImage ? current.image : null } as const;
    }, SERIALIZABLE);

    if (result.status !== "success") {
      await deleteUpload("categories", newImage);
      return result;
    }
    await deleteUpload("categories", result.oldImage);
    revalidatePath(LIST_PATH);
    return { status: "success", id: result.id, name: result.name };
  } catch (error) {
    await deleteUpload("categories", newImage);
    if (isWriteConflict(error)) return { status: "busy" };
    throw error;
  }
}

/**
 * Soft delete: sets deletedAt instead of removing the row, because products will belong
 * to categories. Checks, in order: permission, a valid id for an active category, then
 * whether products still use it (blocked with an explanation instead of orphaning them).
 * The image file is kept, so a category restored later still has its picture.
 */
export async function deleteCategory(rawId: unknown): Promise<DeleteRecordResult> {
  const access = await requirePermission("categories.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };

  try {
    const result = await db.$transaction(async (tx) => {
      const category = await tx.category.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true, name: true } });
      if (!category) return { status: "not-found" } as const;

      // In the same transaction as the delete, so a product can't be added in between.
      const blocker = await categoryDeleteBlocker(category.id, tx);
      if (blocker) return { status: "blocked", message: blocker } as const;

      await tx.category.update({ where: { id: category.id }, data: { deletedAt: new Date() } });
      return { status: "success", name: category.name } as const;
    }, SERIALIZABLE);

    if (result.status === "success") revalidatePath(LIST_PATH);
    return result;
  } catch (error) {
    if (isWriteConflict(error)) return { status: "blocked", message: "มีการแก้ไขข้อมูลพร้อมกัน กรุณาลองลบอีกครั้ง" };
    throw error;
  }
}
