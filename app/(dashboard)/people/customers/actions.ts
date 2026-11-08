"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { RecordActionResult } from "@/components/form/RecordForm";
import type { DeleteRecordResult } from "@/components/list/DeleteRecordButton";
import { customerDeleteBlocker, notDeleted } from "@/lib/customers";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { customerErrors, customerSchema, DUPLICATE_CUSTOMER_NAME, type CustomerField } from "@/lib/validation/customer";

/** Same shape and order of checks as the supplier and warehouse actions. */
export type CustomerActionResult = RecordActionResult<CustomerField>;

const LIST_PATH = "/people/customers";

async function nameTaken(name: string, exceptId?: string) {
  // Only customers that are not deleted count; the database collation ignores case.
  const existing = await db.customer.findFirst({ where: { name, ...notDeleted }, select: { id: true } });
  return Boolean(existing && existing.id !== exceptId);
}

export async function createCustomer(input: unknown): Promise<CustomerActionResult> {
  // 1. Permission first, read from the session and database, never from the client.
  const access = await requirePermission("customers.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate with the same schema the form uses. Unknown keys are dropped, so a request
  //    cannot set systemKey (which marks the protected default customer) or deletedAt.
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: customerErrors(input) };
  const data = parsed.data;

  if (await nameTaken(data.name)) return { status: "invalid", errors: { name: DUPLICATE_CUSTOMER_NAME } };

  const customer = await db.customer.create({ data, select: { id: true, name: true } });

  revalidatePath(LIST_PATH);
  return { status: "success", ...customer };
}

const idSchema = z.string().trim().min(1).max(50);

/**
 * Bound to a record id on the edit page (`updateCustomer.bind(null, id)`). A bound id
 * travels through the browser and could be changed, so it is treated as untrusted: it
 * is validated, and the record must exist and not be deleted before anything else.
 *
 * The update only writes the form's fields. systemKey is not one of them, so editing the
 * default "direct customer" (e.g. renaming it) can never remove what makes it the default.
 */
export async function updateCustomer(rawId: unknown, input: unknown): Promise<CustomerActionResult> {
  const access = await requirePermission("customers.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const existing = await db.customer.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true } });
  if (!existing) return { status: "not-found" };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", errors: customerErrors(input) };
  const data = parsed.data;

  if (await nameTaken(data.name, id.data)) return { status: "invalid", errors: { name: DUPLICATE_CUSTOMER_NAME } };

  // `deletedAt: null` in the update itself, so a customer deleted meanwhile is not revived.
  const { count } = await db.customer.updateMany({ where: { id: id.data, ...notDeleted }, data });
  if (count === 0) return { status: "not-found" };

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id.data}/edit`);
  return { status: "success", id: id.data, name: data.name };
}

/**
 * Soft delete: sets deletedAt instead of removing the row, because sales and quotations
 * will reference customers. Same checks and order as the other delete actions:
 * permission, a valid id for a customer that exists and is not deleted, then the in-use
 * check (which also protects the default "direct customer").
 */
export async function deleteCustomer(rawId: unknown): Promise<DeleteRecordResult> {
  const access = await requirePermission("customers.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const customer = await db.customer.findFirst({
    where: { id: id.data, ...notDeleted },
    select: { id: true, name: true, systemKey: true },
  });
  if (!customer) return { status: "not-found" };

  const blocker = await customerDeleteBlocker(customer);
  if (blocker) return { status: "blocked", message: blocker };

  // `systemKey: null` in the update itself as a second guard: even if the check above
  // were bypassed, a built-in record such as the default customer is never soft-deleted.
  const { count } = await db.customer.updateMany({
    where: { id: customer.id, ...notDeleted, systemKey: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) return { status: "not-found" };

  revalidatePath(LIST_PATH);
  return { status: "success", name: customer.name };
}
