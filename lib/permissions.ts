import { auth } from "@/auth";
import { db } from "@/lib/db";

export type Permission =
  | "warehouses.manage"
  | "suppliers.manage"
  | "customers.manage"
  | "users.manage"
  | "categories.manage"
  | "products.manage"
  | "adjustments.manage";

// TEMPORARY: a fixed role → permission map until the Roles page exists. When it does,
// replace this lookup (for example with a RolePermission table); callers only use
// `can` and `requirePermission`, so no server action needs to change.
const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  // Only admins manage staff accounts.
  admin: ["warehouses.manage", "suppliers.manage", "customers.manage", "users.manage", "categories.manage", "products.manage", "adjustments.manage"],
  manager: ["warehouses.manage", "suppliers.manage", "customers.manage", "categories.manage", "products.manage", "adjustments.manage"],
  // Stock staff look after product master data (categories, products; later units).
  stock: ["warehouses.manage", "categories.manage", "products.manage", "adjustments.manage"],
  // Sales staff serve customers at the POS, so they can add and edit them.
  sales: ["customers.manage"],
};

export function roleHasPermission(role: string | null | undefined, permission: Permission) {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission));
}

export type PermissionCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "signed-out" | "forbidden" };

/**
 * Checks the signed-in user's permission. The role is read from the database, not the
 * sign-in token, so a role change takes effect immediately.
 */
export async function requirePermission(permission: Permission): Promise<PermissionCheck> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, reason: "signed-out" };

  // A deleted user is treated as signed out, even if their sign-in token is still valid.
  const user = await db.user.findFirst({ where: { id: userId, deletedAt: null }, select: { role: true } });
  if (!user) return { ok: false, reason: "signed-out" };
  if (!roleHasPermission(user.role, permission)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId };
}

/** For deciding what to show. Server actions must still call requirePermission. */
export async function can(permission: Permission) {
  return (await requirePermission(permission)).ok;
}
