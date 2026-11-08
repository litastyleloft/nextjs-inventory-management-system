import { auth } from "@/auth";
import { db } from "@/lib/db";

export type Permission = "warehouses.manage" | "suppliers.manage" | "customers.manage";

// TEMPORARY: a fixed role → permission map until the Roles page exists. When it does,
// replace this lookup (for example with a RolePermission table); callers only use
// `can` and `requirePermission`, so no server action needs to change.
const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  admin: ["warehouses.manage", "suppliers.manage", "customers.manage"],
  manager: ["warehouses.manage", "suppliers.manage", "customers.manage"],
  stock: ["warehouses.manage"],
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

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return { ok: false, reason: "signed-out" };
  if (!roleHasPermission(user.role, permission)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId };
}

/** For deciding what to show. Server actions must still call requirePermission. */
export async function can(permission: Permission) {
  return (await requirePermission(permission)).ok;
}
