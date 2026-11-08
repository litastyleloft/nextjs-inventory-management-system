import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { paginate, type ListParams } from "@/lib/list";

/**
 * Data access for staff accounts. Every query goes through here so the soft-delete filter
 * is never forgotten, and every select is explicit so the password hash is never read
 * into a page or sent to the browser.
 */
export const notDeleted = { deletedAt: null } satisfies Prisma.UserWhereInput;

const listSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  image: true,
  createdAt: true,
  roleRef: { select: { id: true, name: true, tone: true } },
} satisfies Prisma.UserSelect;

export type UserRow = Prisma.UserGetPayload<{ select: typeof listSelect }>;

export async function listUsers({ q, page, size }: ListParams) {
  // The design searches by name, email, phone or role name.
  const search = q
    ? {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { phoneNumber: { contains: q } },
          { roleRef: { name: { contains: q } } },
        ],
      }
    : {};
  const where = { ...notDeleted, ...search } satisfies Prisma.UserWhereInput;

  const [total, totalActive] = await Promise.all([
    db.user.count({ where }),
    q ? db.user.count({ where: notDeleted }) : null,
  ]);
  const slice = paginate(total, page, size);
  const rows = await db.user.findMany({
    where,
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: slice.skip,
    take: slice.take,
  });

  return { rows, total, totalActive: totalActive ?? total, page: slice.page, pages: slice.pages, size };
}

/** A user for the edit form. The password hash is deliberately not selected. */
export function getUserForEdit(id: string) {
  return db.user.findFirst({
    where: { id, ...notDeleted },
    select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, image: true, role: true, updatedAt: true },
  });
}

export const ADMIN_ROLE = "admin";

/**
 * True when `userId` is the only active (not deleted) admin left. Used to stop the last
 * admin from being demoted or deleted, which would leave nobody able to manage users.
 */
export async function isLastActiveAdmin(userId: string) {
  const user = await db.user.findFirst({ where: { id: userId, ...notDeleted }, select: { role: true } });
  if (user?.role !== ADMIN_ROLE) return false;
  const otherAdmins = await db.user.count({ where: { ...notDeleted, role: ADMIN_ROLE, id: { not: userId } } });
  return otherAdmins === 0;
}

export const LAST_ADMIN_MESSAGE = "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน";
export const CANNOT_DELETE_SELF = "คุณไม่สามารถลบบัญชีที่กำลังใช้งานอยู่";

/**
 * All roles for the role dropdown, from the Role table: the built-in admin role first,
 * then oldest first (ties by key), which gives the design's order for the four seeded roles.
 */
export function listRoles() {
  return db.role.findMany({
    select: { id: true, name: true, description: true },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }, { id: "asc" }],
  });
}
