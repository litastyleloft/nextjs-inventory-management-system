import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for customers, mirroring lib/suppliers.ts. Every query goes through here
 * so the soft-delete filter is never forgotten.
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.CustomerWhereInput;

/**
 * systemKey of the default "direct customer": the walk-in customer the POS uses when no
 * customer is selected (design: "ลูกค้าหน้าร้าน"). Find it by this key, never by name.
 */
export const DIRECT_CUSTOMER_KEY = "direct-customer";

const listSelect = {
  id: true,
  name: true,
  phoneNumber: true,
  systemKey: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect;

export type CustomerRow = Prisma.CustomerGetPayload<{ select: typeof listSelect }>;

export async function listCustomers({ q, page, size }: ListParams) {
  const search = q
    ? {
        OR: [
          { name: { contains: q } },
          { phoneNumber: { contains: q } },
          { city: { contains: q } },
        ],
      }
    : {};
  const where = { ...notDeleted, ...search } satisfies Prisma.CustomerWhereInput;

  const [total, totalActive] = await Promise.all([
    db.customer.count({ where }),
    q ? db.customer.count({ where: notDeleted }) : null,
  ]);
  const slice = paginate(total, page, size);
  const rows = await db.customer.findMany({
    where,
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: slice.skip,
    take: slice.take,
  });

  return { rows, total, totalActive: totalActive ?? total, page: slice.page, pages: slice.pages, size };
}

/**
 * Why this customer can't be deleted right now, or null if it can. Deleting is a soft
 * delete, but sales and quotations will point at customers, so one in use must stay.
 *
 * Add checks here as those modules are built, e.g.:
 *   - Sales / quotations / billing notes for this customer
 *     → "มีรายการขาย … บิล ระบบจึงเก็บประวัติไว้"
 * (Messages from design/src/pages/people-list.tpl.html.)
 */
export async function customerDeleteBlocker(customer: { id: string; systemKey: string | null }): Promise<string | null> {
  // The default "direct customer" is what the POS sells to when no customer is chosen.
  // Deleting it would leave walk-in sales with no customer, so it is never deletable.
  if (customer.systemKey === DIRECT_CUSTOMER_KEY) return "ลูกค้าหน้าร้านเป็นลูกค้าเริ่มต้นของ POS";
  return null;
}

/**
 * The default walk-in customer, for the POS to use when no customer is selected.
 * Created by `npx prisma db seed -- --only customers` if it does not exist.
 */
export function getDirectCustomer() {
  return db.customer.findFirst({ where: { systemKey: DIRECT_CUSTOMER_KEY, ...notDeleted } });
}

export function getCustomer(id: string) {
  return db.customer.findFirst({ where: { id, ...notDeleted } });
}
