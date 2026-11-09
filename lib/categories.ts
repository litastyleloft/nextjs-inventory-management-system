import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for product categories, mirroring lib/suppliers.ts. Every query goes
 * through here so the soft-delete filter is never forgotten.
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.CategoryWhereInput;

const listSelect = {
  id: true,
  name: true,
  code: true,
  image: true,
  composition: true,
  weave: true,
  pattern: true,
  widthInches: true,
  gsm: true,
  // Active products only.
  _count: { select: { products: { where: { deletedAt: null } } } },
} satisfies Prisma.CategorySelect;

type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof listSelect }>;

/**
 * A category as the list and the modal use it. The width is a plain number: Prisma's
 * Decimal can't be passed to client components.
 */
export type CategoryRow = Omit<CategoryRecord, "widthInches" | "_count"> & {
  widthInches: number | null;
  /** Active products in this category. */
  productCount: number;
};

function toRow({ _count, ...c }: CategoryRecord): CategoryRow {
  return { ...c, widthInches: c.widthInches === null ? null : c.widthInches.toNumber(), productCount: _count.products };
}

export async function listCategories({ q, page, size }: ListParams) {
  // The design searches by name, code, composition or weave.
  const search = q
    ? {
        OR: [
          { name: { contains: q } },
          { code: { contains: q } },
          { composition: { contains: q } },
          { weave: { contains: q } },
        ],
      }
    : {};
  const where = { ...notDeleted, ...search } satisfies Prisma.CategoryWhereInput;

  const [total, totalActive] = await Promise.all([
    db.category.count({ where }),
    q ? db.category.count({ where: notDeleted }) : null,
  ]);
  const slice = paginate(total, page, size);
  const rows = await db.category.findMany({
    where,
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: slice.skip,
    take: slice.take,
  });

  return { rows: rows.map(toRow), total, totalActive: totalActive ?? total, page: slice.page, pages: slice.pages, size };
}

export async function getCategory(id: string) {
  const c = await db.category.findFirst({ where: { id, ...notDeleted }, select: listSelect });
  return c && toRow(c);
}

/**
 * Active products in this category. Used to lock the category code (it is the first part
 * of every product code) and to block deleting a category that still has products.
 * Pass the transaction client when calling from inside a transaction.
 */
export function categoryProductCount(id: string, client: Prisma.TransactionClient = db): Promise<number> {
  return client.product.count({ where: { categoryId: id, deletedAt: null } });
}

/**
 * Why this category can't be deleted right now, or null if it can. Deleting is a soft
 * delete, but products belong to a category, so a category with products must stay
 * (message from design/src/pages/categories.page.html).
 */
export async function categoryDeleteBlocker(id: string, client: Prisma.TransactionClient = db): Promise<string | null> {
  const count = await categoryProductCount(id, client);
  return count > 0 ? `มีผ้า ${count} รายการอยู่ในหมวดหมู่นี้ ย้ายผ้าไปหมวดหมู่อื่นก่อน แล้วจึงลบหมวดหมู่` : null;
}
