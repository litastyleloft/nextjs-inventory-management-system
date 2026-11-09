import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for stock adjustments. Every query goes through here so the soft-delete
 * filter is never forgotten.
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.AdjustmentWhereInput;

const listSelect = {
  id: true,
  reference: true,
  date: true,
  reason: true,
  createdAt: true,
  warehouse: { select: { name: true } },
  createdBy: { select: { firstName: true, lastName: true } },
  items: { select: { quantity: true, type: true, product: { select: { unit: true } } } },
} satisfies Prisma.AdjustmentSelect;

export type AdjustmentRow = {
  id: string;
  reference: string;
  date: Date;
  reason: string;
  createdAt: Date;
  warehouseName: string;
  createdByName: string | null;
  itemCount: number;
  /** Total added and taken away, in the products' unit (all yards today). */
  added: number;
  removed: number;
};

/** A product as the adjustment form shows it, with its stock in one warehouse. */
export type AdjustmentProduct = {
  id: string;
  code: string;
  name: string;
  unit: string;
  stockAlert: number;
  coverUrl: string | null;
  /** This warehouse's ProductStock quantity; 0 when it has no row yet. */
  stock: number;
};

const productSelect = {
  id: true,
  code: true,
  name: true,
  unit: true,
  stockAlert: true,
  images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

async function withStock(
  warehouseId: string,
  products: Prisma.ProductGetPayload<{ select: typeof productSelect }>[],
): Promise<AdjustmentProduct[]> {
  const rows = await db.productStock.findMany({
    where: { warehouseId, productId: { in: products.map((p) => p.id) } },
    select: { productId: true, quantity: true },
  });
  const stock = new Map(rows.map((r) => [r.productId, r.quantity.toNumber()]));
  return products.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    unit: p.unit,
    stockAlert: p.stockAlert.toNumber(),
    coverUrl: p.images[0]?.url ?? null,
    stock: stock.get(p.id) ?? 0,
  }));
}

/**
 * Active products matching a code or name (all of them, A–Z by code, when the search is
 * empty), each with its current stock in the given warehouse.
 */
export async function searchProductsInWarehouse(warehouseId: string, q: string, take = 20) {
  const products = await db.product.findMany({
    where: { deletedAt: null, ...(q ? { OR: [{ code: { contains: q } }, { name: { contains: q } }] } : {}) },
    select: productSelect,
    orderBy: { code: "asc" },
    take,
  });
  return withStock(warehouseId, products);
}

/** Given products' stock in a warehouse (e.g. after the warehouse is changed). Deleted products are left out. */
export async function productsInWarehouse(warehouseId: string, productIds: string[]) {
  const products = await db.product.findMany({ where: { id: { in: productIds }, deletedAt: null }, select: productSelect });
  return withStock(warehouseId, products);
}

/**
 * One active adjustment with everything the view page shows: warehouse, who made it, and
 * each line's product (even if the product was deleted since) with the stock before/after.
 */
export function getAdjustment(id: string) {
  return db.adjustment.findFirst({
    where: { id, ...notDeleted },
    include: {
      warehouse: { select: { name: true, deletedAt: true } },
      createdBy: { select: { firstName: true, lastName: true, deletedAt: true } },
      items: {
        orderBy: { product: { code: "asc" } },
        include: {
          product: {
            select: { id: true, code: true, name: true, unit: true, deletedAt: true, images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 } },
          },
        },
      },
    },
  });
}

export async function listAdjustments({ q, page, size }: ListParams) {
  // Search by reference, warehouse, reason, or a product's code or name in the lines.
  const search: Prisma.AdjustmentWhereInput = q
    ? {
        OR: [
          { reference: { contains: q } },
          { warehouse: { name: { contains: q } } },
          { reason: { contains: q } },
          { items: { some: { product: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } } } },
        ],
      }
    : {};
  const where = { ...notDeleted, ...search } satisfies Prisma.AdjustmentWhereInput;

  const [total, totalActive] = await Promise.all([
    db.adjustment.count({ where }),
    q ? db.adjustment.count({ where: notDeleted }) : null,
  ]);
  const slice = paginate(total, page, size);
  const records = await db.adjustment.findMany({
    where,
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: slice.skip,
    take: slice.take,
  });

  const rows: AdjustmentRow[] = records.map((a) => {
    const sum = (type: "ADDITION" | "SUBTRACTION") =>
      a.items.filter((i) => i.type === type).reduce((acc, i) => acc + i.quantity.toNumber(), 0);
    return {
      id: a.id,
      reference: a.reference,
      date: a.date,
      reason: a.reason,
      createdAt: a.createdAt,
      warehouseName: a.warehouse.name,
      createdByName: a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : null,
      itemCount: a.items.length,
      added: sum("ADDITION"),
      removed: sum("SUBTRACTION"),
    };
  });

  return { rows, total, totalActive: totalActive ?? total, page: slice.page, pages: slice.pages, size };
}
