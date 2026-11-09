import type { Prisma } from "@prisma/client";

/**
 * Document reference numbers, e.g. "ADJ-2569-0013" (design: adjustment.page.html):
 * PREFIX-<Buddhist-era year>-<4-digit running number>. The number restarts at 0001 each
 * year. Sales, purchases, transfers… add their prefix here and call nextReference the same
 * way.
 */
export const REFERENCE_PREFIX = {
  adjustment: "ADJ",
} as const;
export type ReferenceKind = keyof typeof REFERENCE_PREFIX;

/** The Buddhist-era year of a date in Bangkok (2026 → 2569). */
export function buddhistYear(date: Date) {
  const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric" }).format(date));
  return year + 543;
}

export const formatReference = (kind: ReferenceKind, year: number, n: number) =>
  `${REFERENCE_PREFIX[kind]}-${year}-${String(n).padStart(4, "0")}`;

/**
 * Takes the next number of a series. Must be called inside the transaction that creates
 * the document: the upsert locks the series row until that transaction ends, so two saves
 * at the same moment get different numbers, and a save that rolls back gives its number
 * back (no gaps from failed saves).
 */
export async function nextReference(tx: Prisma.TransactionClient, kind: ReferenceKind, date: Date) {
  const year = buddhistYear(date);
  const key = `${REFERENCE_PREFIX[kind]}-${year}`;
  const row = await tx.documentSequence.upsert({
    where: { key },
    create: { key, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatReference(kind, year, row.lastNumber);
}

/**
 * The number the next document would get, for showing on an empty form ("ระบบออกเลขให้
 * อัตโนมัติ"). Only a preview: the real number is taken when saving and may be higher if
 * someone else saves first.
 */
export async function previewReference(client: Prisma.TransactionClient, kind: ReferenceKind, date: Date) {
  const year = buddhistYear(date);
  const row = await client.documentSequence.findUnique({ where: { key: `${REFERENCE_PREFIX[kind]}-${year}` } });
  return formatReference(kind, year, (row?.lastNumber ?? 0) + 1);
}
