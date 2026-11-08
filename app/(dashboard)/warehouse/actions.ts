"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import type { RecordActionResult } from "@/components/form/RecordForm";
import type { DeleteRecordResult } from "@/components/list/DeleteRecordButton";
import { DUPLICATE_WAREHOUSE_NAME, warehouseErrors, warehouseSchema, type WarehouseField } from "@/lib/validation/warehouse";
import { notDeleted, warehouseDeleteBlocker } from "@/lib/warehouses";

export type WarehouseActionResult = RecordActionResult<WarehouseField>;

const idSchema = z.string().trim().min(1).max(50);

async function nameTaken(name: string, exceptId?: string) {
  // Only warehouses that are not deleted count; the database collation ignores case.
  const existing = await db.warehouse.findFirst({ where: { name, ...notDeleted }, select: { id: true } });
  return Boolean(existing && existing.id !== exceptId);
}

export async function createWarehouse(input: unknown): Promise<WarehouseActionResult> {
  // 1. Permission first, read from the session and database, never from the client.
  const access = await requirePermission("warehouses.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate with the same schema the form uses. Unknown keys (id, deletedAt, …) are dropped.
  const parsed = warehouseSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: warehouseErrors(input) };
  const data = parsed.data;

  if (await nameTaken(data.name)) return { status: "invalid", errors: { name: DUPLICATE_WAREHOUSE_NAME } };

  const warehouse = await db.warehouse.create({ data, select: { id: true, name: true } });

  revalidatePath("/warehouse");
  return { status: "success", ...warehouse };
}

/**
 * Bound to a record id on the edit page (`updateWarehouse.bind(null, id)`). A bound id
 * travels through the browser and could be changed, so it is treated as untrusted:
 * it is validated, and the record must exist and not be deleted. The permission check
 * means only users allowed to manage warehouses can update any of them.
 */
export async function updateWarehouse(rawId: unknown, input: unknown): Promise<WarehouseActionResult> {
  const access = await requirePermission("warehouses.manage");
  if (!access.ok) return { status: access.reason };

  // The record must exist and not be deleted, before anything else is checked.
  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const existing = await db.warehouse.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true } });
  if (!existing) return { status: "not-found" };

  const parsed = warehouseSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: warehouseErrors(input) };
  const data = parsed.data;

  if (await nameTaken(data.name, id.data)) return { status: "invalid", errors: { name: DUPLICATE_WAREHOUSE_NAME } };

  // `deletedAt: null` in the update itself, so a warehouse deleted meanwhile is not revived.
  const { count } = await db.warehouse.updateMany({ where: { id: id.data, ...notDeleted }, data });
  if (count === 0) return { status: "not-found" };

  revalidatePath("/warehouse");
  revalidatePath(`/warehouse/${id.data}/edit`);
  return { status: "success", id: id.data, name: data.name };
}

export type DeleteWarehouseResult = DeleteRecordResult;

/**
 * Soft delete: sets deletedAt instead of removing the row, because stock, sales and
 * purchases will reference warehouses. The id comes from the browser, so it is
 * validated and must belong to a warehouse that exists and is not already deleted.
 */
export async function deleteWarehouse(rawId: unknown): Promise<DeleteWarehouseResult> {
  const access = await requirePermission("warehouses.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const warehouse = await db.warehouse.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true, name: true } });
  if (!warehouse) return { status: "not-found" };

  // In use? Block instead of leaving other records pointing at a deleted warehouse.
  const blocker = await warehouseDeleteBlocker(warehouse.id);
  if (blocker) return { status: "blocked", message: blocker };

  const { count } = await db.warehouse.updateMany({ where: { id: warehouse.id, ...notDeleted }, data: { deletedAt: new Date() } });
  if (count === 0) return { status: "not-found" };

  revalidatePath("/warehouse");
  return { status: "success", name: warehouse.name };
}
