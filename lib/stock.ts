import { Prisma } from "@prisma/client";

/**
 * The stock service: the only code that changes ProductStock quantities. Every change
 * runs inside the caller's transaction, so a document (adjustment, and later purchase,
 * sale, transfer) and its stock changes are saved together or not at all.
 *
 * Concurrency: the product × warehouse row is locked (SELECT … FOR UPDATE) before it is
 * read, so two documents changing the same stock run one after the other and the second
 * sees the first's result: stock can't be over-drawn by two saves at once. Callers that
 * change several rows should apply them in a stable order (e.g. sorted by productId) so
 * two documents never wait on each other in opposite orders.
 */

export class InsufficientStockError extends Error {
  constructor(
    readonly productId: string,
    readonly available: Prisma.Decimal,
    readonly requested: Prisma.Decimal,
  ) {
    super(`Insufficient stock for ${productId}: ${available} available, ${requested} requested`);
    this.name = "InsufficientStockError";
  }
}

export type StockChange = {
  productId: string;
  warehouseId: string;
  /** Positive amount, in the product's unit. */
  quantity: Prisma.Decimal | string;
  direction: "in" | "out";
};

/**
 * Adds to or takes from one product's stock in one warehouse, creating the row on first
 * use. Throws InsufficientStockError (the caller's transaction then rolls back) if taking
 * out would leave less than zero. Returns the quantity before and after.
 */
export async function changeStock(tx: Prisma.TransactionClient, change: StockChange) {
  const amount = new Prisma.Decimal(change.quantity);
  if (amount.lte(0)) throw new Error("Stock change quantity must be positive");

  const rows = await tx.$queryRaw<{ id: string; quantity: Prisma.Decimal }[]>`
    SELECT id, quantity FROM ProductStock
    WHERE productId = ${change.productId} AND warehouseId = ${change.warehouseId}
    FOR UPDATE`;
  const row = rows[0];
  const before = new Prisma.Decimal(row?.quantity ?? 0);
  const after = change.direction === "in" ? before.plus(amount) : before.minus(amount);
  if (after.isNegative()) throw new InsufficientStockError(change.productId, before, amount);

  if (row) {
    await tx.productStock.update({ where: { id: row.id }, data: { quantity: after } });
  } else {
    await tx.productStock.create({ data: { productId: change.productId, warehouseId: change.warehouseId, quantity: after } });
  }
  return { before, after };
}
