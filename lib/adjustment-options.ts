/**
 * Choices for stock adjustments, from design/src/pages/adjustment.page.html. Safe to
 * import in client components.
 */

/** Why the stock is being adjusted (required; the reason trail). */
export const ADJUSTMENT_REASONS = [
  "ตรวจนับสต็อก",
  "ผ้าชำรุด / มีตำหนิ",
  "เศษผ้า / ปลายม้วน",
  "ผ้าหดตัวหลังฟอก",
  "สูญหาย",
  "พบสินค้าเกิน",
  "อื่น ๆ",
] as const;

/** Line types, as stored (Prisma enum AdjustmentType) and as labelled in the design. */
export const ADJUSTMENT_TYPES = [
  { value: "ADDITION", label: "เพิ่ม (รับเข้า)", short: "เพิ่ม" },
  { value: "SUBTRACTION", label: "ลด (ตัดออก)", short: "ลด" },
] as const;
export type AdjustmentTypeValue = (typeof ADJUSTMENT_TYPES)[number]["value"];
