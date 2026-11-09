import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for products. Every query goes through here so the soft-delete filter is
 * never forgotten. Stock is never a product column: it is always summed from ProductStock
 * (one row per product × warehouse).
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.ProductWhereInput;

import { unitLabel } from "@/lib/units";

export { UNIT_LABEL, unitLabel } from "@/lib/units";

export const STOCK_LEVELS = ["in-stock", "low-stock", "out-of-stock"] as const;
export type StockLevel = (typeof STOCK_LEVELS)[number];

/** Out of stock at 0 or less; low at or below the alert; otherwise in stock (design rule). */
export function stockLevel(total: number, alert: number): StockLevel {
  if (total <= 0) return "out-of-stock";
  if (total <= alert) return "low-stock";
  return "in-stock";
}

/** The list's filter params (?category=…&stock=…). Anything invalid is ignored. */
const filterSchema = z.object({
  category: z.string().trim().max(50).catch(""),
  stock: z.enum(STOCK_LEVELS).or(z.literal("")).catch(""),
});
export type ProductFilters = z.infer<typeof filterSchema>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
export function parseProductFilters(raw: Record<string, string | string[] | undefined>): ProductFilters {
  return filterSchema.parse({ category: first(raw.category) ?? "", stock: first(raw.stock) ?? "" });
}

const listSelect = {
  id: true,
  name: true,
  code: true,
  unit: true,
  stockAlert: true,
  createdAt: true,
  category: { select: { name: true, composition: true } },
  images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

export type ProductRow = {
  id: string;
  name: string;
  code: string;
  unit: string;
  categoryName: string;
  composition: string | null;
  /** Width in inches, from the code's 2-digit width segment. */
  widthInches: number;
  coverUrl: string | null;
  /** Sum of ProductStock across warehouses. */
  stock: number;
  stockAlert: number;
  level: StockLevel;
  createdAt: Date;
};

/** Total stock per product, summed over its ProductStock rows. Missing → 0. */
export async function stockTotals(productIds: string[], client: Prisma.TransactionClient = db) {
  if (!productIds.length) return new Map<string, number>();
  const sums = await client.productStock.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  });
  return new Map(sums.map((s) => [s.productId, s._sum.quantity?.toNumber() ?? 0]));
}

export async function listProducts({ q, page, size }: ListParams, filters: ProductFilters) {
  // The design searches by name, code or composition (the composition is the category's).
  const search: Prisma.ProductWhereInput = q
    ? { OR: [{ name: { contains: q } }, { code: { contains: q } }, { category: { composition: { contains: q } } }] }
    : {};
  const where: Prisma.ProductWhereInput = {
    ...notDeleted,
    ...search,
    ...(filters.category ? { categoryId: filters.category } : {}),
  };
  const orderBy = [{ createdAt: "desc" }, { id: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[];

  let ids: string[] | null = null;
  if (filters.stock) {
    // The stock level depends on summed ProductStock, which SQL paging can't filter on
    // through Prisma, so work out the matching ids first (fine at a fabric shop's scale).
    const all = await db.product.findMany({ where, select: { id: true, stockAlert: true }, orderBy });
    const totals = await stockTotals(all.map((p) => p.id));
    ids = all.filter((p) => stockLevel(totals.get(p.id) ?? 0, p.stockAlert.toNumber()) === filters.stock).map((p) => p.id);
  }

  const [total, totalActive, categoriesInUse] = await Promise.all([
    ids ? ids.length : db.product.count({ where }),
    db.product.count({ where: notDeleted }),
    db.product.groupBy({ by: ["categoryId"], where: notDeleted }).then((g) => g.length),
  ]);
  const slice = paginate(total, page, size);
  const records = await db.product.findMany({
    where: ids ? { id: { in: ids.slice(slice.skip, slice.skip + slice.take) } } : where,
    select: listSelect,
    orderBy,
    ...(ids ? {} : { skip: slice.skip, take: slice.take }),
  });
  const totals = await stockTotals(records.map((p) => p.id));

  const rows: ProductRow[] = records.map((p) => {
    const stock = totals.get(p.id) ?? 0;
    const stockAlert = p.stockAlert.toNumber();
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      unit: p.unit,
      categoryName: p.category.name,
      composition: p.category.composition,
      widthInches: Number(p.code.slice(3, 5)),
      coverUrl: p.images[0]?.url ?? null,
      stock,
      stockAlert,
      level: stockLevel(stock, stockAlert),
      createdAt: p.createdAt,
    };
  });

  return { rows, total, totalActive, categoriesInUse, page: slice.page, pages: slice.pages, size };
}

/**
 * One active product with its images (in order) and its stock per warehouse, for the
 * edit and view pages. Null when it doesn't exist or is deleted.
 */
export function getProduct(id: string) {
  return db.product.findFirst({
    where: { id, ...notDeleted },
    include: {
      category: { select: { id: true, code: true, name: true, composition: true, weave: true, pattern: true, widthInches: true, gsm: true, deletedAt: true } },
      supplier: { select: { id: true, name: true, deletedAt: true } },
      images: { select: { id: true, url: true }, orderBy: { position: "asc" } },
      stocks: {
        select: { quantity: true, updatedAt: true, warehouse: { select: { id: true, name: true, deletedAt: true } } },
        orderBy: { warehouse: { name: "asc" } },
      },
    },
  });
}

/** The design's delete confirmation text (products.page.html askDelete). */
export function productDeleteText(code: string, stock: number, unit: string) {
  const left = stock > 0 ? ` และตัดสต็อกคงเหลือ ${stock.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ${unitLabel(unit).short} ออก` : "";
  return `ระบบจะนำ ${code} ออกจากรายการสินค้า${left} ประวัติการขายและการซื้อเดิมยังคงอยู่ การลบนี้ไม่สามารถย้อนกลับได้`;
}

/**
 * Dropdown options for the product form, from the database (active rows only), not the
 * design's sample lists. Shared by the create and edit pages.
 */
export async function productFormOptions() {
  const [categories, warehouses, suppliers] = await Promise.all([
    categoryOptions(),
    db.warehouse.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    categories: categories.map((c) => ({ ...c, widthInches: c.widthInches?.toNumber() ?? null })),
    warehouses,
    suppliers,
  };
}

/** Active categories for the filter and the product form. */
export function categoryOptions() {
  return db.category.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, name: true, widthInches: true },
    orderBy: [{ code: "asc" }],
  });
}

/**
 * Why this product can't be deleted right now, or null if it can. Purchases, sales and
 * transfers will reference products; deleting one they use would orphan those records.
 *
 * Add the checks here when those modules are built, e.g.:
 *   purchase lines / sale lines / transfer lines with productId = id
 *     → "มีรายการซื้อ/ขาย/โอนย้ายที่อ้างถึงสินค้านี้ ระบบจึงเก็บประวัติไว้"
 * Until then nothing references products.
 */
export async function productDeleteBlocker(id: string, client: Prisma.TransactionClient = db): Promise<string | null> {
  void id;
  void client;
  return null;
}
