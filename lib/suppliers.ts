import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for suppliers, mirroring lib/warehouses.ts. Every query goes through here
 * so the soft-delete filter is never forgotten.
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.SupplierWhereInput;

const listSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  createdAt: true,
} satisfies Prisma.SupplierSelect;

export type SupplierRow = Prisma.SupplierGetPayload<{ select: typeof listSelect }>;

export async function listSuppliers({ q, page, size }: ListParams) {
  // The design searches by name, email, phone or city.
  const search = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phoneNumber: { contains: q } },
          { city: { contains: q } },
        ],
      }
    : {};
  const where = { ...notDeleted, ...search } satisfies Prisma.SupplierWhereInput;

  const [total, totalActive] = await Promise.all([
    db.supplier.count({ where }),
    q ? db.supplier.count({ where: notDeleted }) : null,
  ]);
  const slice = paginate(total, page, size);
  const rows = await db.supplier.findMany({
    where,
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: slice.skip,
    take: slice.take,
  });

  return { rows, total, totalActive: totalActive ?? total, page: slice.page, pages: slice.pages, size };
}

/**
 * Why this supplier can't be deleted right now, or null if it can. Deleting is a soft
 * delete, but purchases will point at suppliers, so a supplier in use must stay.
 *
 * Checked now: active products that have this supplier as their main supplier.
 * Add when the Purchases module is built:
 *   - Purchases / purchase returns referencing this supplier
 *     → "มีใบสั่งซื้อ … ใบที่อ้างถึงผู้จำหน่ายรายนี้ ระบบจึงเก็บประวัติไว้"
 *     (message from design/src/pages/people-list.tpl.html)
 */
export async function supplierDeleteBlocker(id: string): Promise<string | null> {
  const products = await db.product.count({ where: { supplierId: id, deletedAt: null } });
  if (products > 0) return `เป็นผู้จำหน่ายหลักของสินค้า ${products.toLocaleString("th-TH")} รายการ เปลี่ยนผู้จำหน่ายของสินค้าเหล่านั้นก่อน แล้วจึงลบ`;
  return null;
}

export function getSupplier(id: string) {
  return db.supplier.findFirst({ where: { id, ...notDeleted } });
}
