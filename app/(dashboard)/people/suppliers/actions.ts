"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { RecordActionResult } from "@/components/form/RecordForm";
import type { DeleteRecordResult } from "@/components/list/DeleteRecordButton";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { notDeleted, supplierDeleteBlocker } from "@/lib/suppliers";
import { DUPLICATE_SUPPLIER_NAME, supplierErrors, supplierSchema, type SupplierField } from "@/lib/validation/supplier";

/** Same shape and order of checks as app/(dashboard)/warehouse/actions.ts. */
export type SupplierActionResult = RecordActionResult<SupplierField>;

const LIST_PATH = "/people/suppliers";

async function nameTaken(name: string, exceptId?: string) {
  // Only suppliers that are not deleted count; the database collation ignores case.
  const existing = await db.supplier.findFirst({ where: { name, ...notDeleted }, select: { id: true } });
  return Boolean(existing && existing.id !== exceptId);
}

export async function createSupplier(input: unknown): Promise<SupplierActionResult> {
  // 1. Permission first, read from the session and database, never from the client.
  const access = await requirePermission("suppliers.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate with the same schema the form uses. Unknown keys (id, deletedAt, …) are dropped.
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: supplierErrors(input) };
  const data = parsed.data;

  if (await nameTaken(data.name)) return { status: "invalid", errors: { name: DUPLICATE_SUPPLIER_NAME } };

  const supplier = await db.supplier.create({ data, select: { id: true, name: true } });

  revalidatePath(LIST_PATH);
  return { status: "success", ...supplier };
}

const idSchema = z.string().trim().min(1).max(50);

/**
 * Bound to a record id on the edit page (`updateSupplier.bind(null, id)`). A bound id
 * travels through the browser and could be changed, so it is treated as untrusted: it
 * is validated, and the record must exist and not be deleted before anything else.
 */
export async function updateSupplier(rawId: unknown, input: unknown): Promise<SupplierActionResult> {
  const access = await requirePermission("suppliers.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const existing = await db.supplier.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true } });
  if (!existing) return { status: "not-found" };

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: supplierErrors(input) };
  const data = parsed.data;

  if (await nameTaken(data.name, id.data)) return { status: "invalid", errors: { name: DUPLICATE_SUPPLIER_NAME } };

  // `deletedAt: null` in the update itself, so a supplier deleted meanwhile is not revived.
  const { count } = await db.supplier.updateMany({ where: { id: id.data, ...notDeleted }, data });
  if (count === 0) return { status: "not-found" };

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id.data}/edit`);
  return { status: "success", id: id.data, name: data.name };
}

/**
 * Soft delete: sets deletedAt instead of removing the row, because purchases will
 * reference suppliers. Same checks and order as deleteWarehouse: permission, a valid id
 * for a supplier that exists and is not deleted, then the in-use check.
 */
export async function deleteSupplier(rawId: unknown): Promise<DeleteRecordResult> {
  const access = await requirePermission("suppliers.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const supplier = await db.supplier.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true, name: true } });
  if (!supplier) return { status: "not-found" };

  // Referenced by purchases? Block instead of leaving them pointing at a deleted supplier.
  const blocker = await supplierDeleteBlocker(supplier.id);
  if (blocker) return { status: "blocked", message: blocker };

  const { count } = await db.supplier.updateMany({ where: { id: supplier.id, ...notDeleted }, data: { deletedAt: new Date() } });
  if (count === 0) return { status: "not-found" };

  revalidatePath(LIST_PATH);
  return { status: "success", name: supplier.name };
}
