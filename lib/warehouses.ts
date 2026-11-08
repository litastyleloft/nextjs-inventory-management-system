import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for warehouses. Every query goes through here so the soft-delete filter
 * is never forgotten: a warehouse with `deletedAt` set does not exist to the app.
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.WarehouseWhereInput;

const listSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  city: true,
  country: true,
  createdAt: true,
} satisfies Prisma.WarehouseSelect;

export type WarehouseRow = Prisma.WarehouseGetPayload<{ select: typeof listSelect }>;

export async function listWarehouses({ q, page, size }: ListParams) {
  const search = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phoneNumber: { contains: q } },
          { city: { contains: q } },
          { country: { contains: q } },
          { zipCode: { contains: q } },
        ],
      }
    : {};
  const where = { ...notDeleted, ...search } satisfies Prisma.WarehouseWhereInput;

  const [total, totalActive] = await Promise.all([
    db.warehouse.count({ where }),
    q ? db.warehouse.count({ where: notDeleted }) : null,
  ]);
  const slice = paginate(total, page, size);
  const rows = await db.warehouse.findMany({
    where,
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: slice.skip,
    take: slice.take,
  });

  return { rows, total, totalActive: totalActive ?? total, page: slice.page, pages: slice.pages, size };
}

/**
 * Why this warehouse can't be deleted right now, or null if it can. Deleting is a soft
 * delete, but other records will point at warehouses, so a warehouse in use must stay.
 *
 * Add a check here as each module that references warehouses is built, e.g.:
 *   - Stock:     on-hand quantity in this warehouse → "คลังนี้ยังมีผ้าคงเหลือ … โอนย้ายสต็อกออกให้หมดก่อน แล้วจึงลบ"
 *   - Transfers: transfers from/to this warehouse   → "มีรายการโอนย้าย … รายการอ้างถึงคลังนี้ ระบบจึงเก็บประวัติไว้"
 *   - Sales / Purchases: documents using this warehouse
 * (Messages follow design/src/pages/people-list.tpl.html.)
 */
export async function warehouseDeleteBlocker(id: string): Promise<string | null> {
  const others = await db.warehouse.count({ where: { ...notDeleted, id: { not: id } } });
  if (others === 0) return "ต้องมีคลังสินค้าอย่างน้อย 1 แห่ง";
  return null;
}

export function getWarehouse(id: string) {
  return db.warehouse.findFirst({ where: { id, ...notDeleted } });
}
