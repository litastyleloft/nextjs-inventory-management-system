"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { productsInWarehouse, searchProductsInWarehouse, type AdjustmentProduct } from "@/lib/adjustments";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { nextReference } from "@/lib/references";
import { changeStock, InsufficientStockError } from "@/lib/stock";
import { unitLabel } from "@/lib/units";
import { adjustmentHeaderErrors, adjustmentSchema, type AdjustmentErrors } from "@/lib/validation/adjustment";

export type ProductLookupResult =
  | { status: "ok"; products: AdjustmentProduct[] }
  | { status: "no-warehouse" | "forbidden" | "signed-out" };

const warehouseIdSchema = z.string().trim().min(1).max(50);

/** The warehouse must be given and active; read from the database, not trusted from the form. */
async function activeWarehouse(rawId: unknown) {
  const id = warehouseIdSchema.safeParse(rawId);
  if (!id.success) return null;
  return db.warehouse.findFirst({ where: { id: id.data, deletedAt: null }, select: { id: true } });
}

/**
 * Product search for the adjustment form: matches by code or name, and shows each
 * product's stock in the chosen warehouse only. Nothing is returned until a warehouse is
 * chosen.
 */
export async function searchAdjustmentProducts(rawWarehouseId: unknown, rawQuery: unknown): Promise<ProductLookupResult> {
  const access = await requirePermission("adjustments.manage");
  if (!access.ok) return { status: access.reason };
  const warehouse = await activeWarehouse(rawWarehouseId);
  if (!warehouse) return { status: "no-warehouse" };
  const q = z.string().trim().max(100).catch("").parse(rawQuery);
  return { status: "ok", products: await searchProductsInWarehouse(warehouse.id, q) };
}

/** Current stock of the products already in the form, for a (newly chosen) warehouse. */
export async function adjustmentLineStock(rawWarehouseId: unknown, rawProductIds: unknown): Promise<ProductLookupResult> {
  const access = await requirePermission("adjustments.manage");
  if (!access.ok) return { status: access.reason };
  const warehouse = await activeWarehouse(rawWarehouseId);
  if (!warehouse) return { status: "no-warehouse" };
  const ids = z.array(z.string().trim().min(1).max(50)).max(200).catch([]).parse(rawProductIds);
  return { status: "ok", products: await productsInWarehouse(warehouse.id, ids) };
}

export type AdjustmentSaveResult =
  | { status: "success"; id: string; reference: string; lineCount: number }
  /** `stock`: the current stock of lines that failed, so the form can show the real limit. */
  | { status: "invalid"; errors: AdjustmentErrors; stock?: Record<string, number> }
  | { status: "busy" }
  | { status: "forbidden" | "signed-out" };

const num = (d: Prisma.Decimal | number) => Number(d).toLocaleString("th-TH", { maximumFractionDigits: 2 });

/**
 * Save an adjustment: one atomic transaction that
 *   1. takes the next reference number (ADJ-<year>-<n>),
 *   2. creates the adjustment,
 *   3. applies every line to ProductStock for the chosen warehouse through the stock
 *      service (Addition adds, Subtraction takes away; the row is created on first use),
 *      recording the stock before and after each line,
 *   4. creates the lines.
 * If any subtraction would take a product below zero, the whole adjustment is rejected:
 * the transaction rolls back, so no document, no number and no stock change is saved.
 */
export async function createAdjustment(input: unknown): Promise<AdjustmentSaveResult> {
  // 1. Permission first, read from the session and database, never from the client.
  const access = await requirePermission("adjustments.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate with the same schema the form uses. Unknown keys are dropped.
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: adjustmentHeaderErrors(input) };
  const data = parsed.data;

  // 3. Re-read the warehouse and products: they must exist and not be deleted.
  const warehouse = await activeWarehouse(data.warehouseId);
  if (!warehouse) return { status: "invalid", errors: { warehouseId: "คลังสินค้านี้ถูกลบไปแล้ว กรุณาเลือกใหม่" } };
  const products = await db.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) }, deletedAt: null },
    select: { id: true, unit: true },
  });
  const unitOf = new Map(products.map((p) => [p.id, p.unit]));
  const missing = data.items.filter((i) => !unitOf.has(i.productId));
  if (missing.length) {
    return {
      status: "invalid",
      errors: { lines: Object.fromEntries(missing.map((i) => [i.productId, "สินค้านี้ถูกลบไปแล้ว นำออกจากรายการ"])) },
    };
  }

  // Lines are applied in productId order, so two adjustments touching the same products
  // always lock their stock rows in the same order (no deadlock).
  const items = [...data.items].sort((a, b) => a.productId.localeCompare(b.productId));

  try {
    const saved = await db.$transaction(
      async (tx) => {
        const reference = await nextReference(tx, "adjustment", new Date());
        const adjustment = await tx.adjustment.create({
          data: {
            reference,
            warehouseId: warehouse.id,
            date: new Date(`${data.date}T00:00:00Z`),
            reason: data.reason,
            notes: data.notes,
            createdById: access.userId,
          },
          select: { id: true, reference: true },
        });
        for (const item of items) {
          const { before, after } = await changeStock(tx, {
            productId: item.productId,
            warehouseId: warehouse.id,
            quantity: item.quantity,
            direction: item.type === "ADDITION" ? "in" : "out",
          });
          await tx.adjustmentItem.create({
            data: { adjustmentId: adjustment.id, productId: item.productId, quantity: item.quantity, type: item.type, stockBefore: before, stockAfter: after },
          });
        }
        return adjustment;
      },
      { timeout: 20_000 },
    );

    // 4. Stock changed: refresh every page that shows it.
    revalidatePath("/adjustments");
    revalidatePath("/adjustments/create"); // the next reference number
    revalidatePath("/products");
    revalidatePath("/products/[id]", "page");
    revalidatePath("/products/[id]/edit", "page");
    return { status: "success", id: saved.id, reference: saved.reference, lineCount: items.length };
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      const unit = unitLabel(unitOf.get(error.productId) ?? "").short;
      return {
        status: "invalid",
        errors: {
          lines: { [error.productId]: `สต็อกไม่พอ ลดได้ไม่เกินคงเหลือ ${num(error.available)} ${unit}` },
        },
        stock: { [error.productId]: error.available.toNumber() },
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002")) {
      return { status: "busy" };
    }
    throw error;
  }
}
