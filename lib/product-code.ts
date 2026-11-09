/**
 * Product codes, AAA00B111222 (design/src/pages/create-product.page.html):
 *   AAA  category code, 3 letters      00   width in inches, 2 digits
 *   B    lot, 1 letter                 111  pattern, 3 digits      222  colour, 3 digits
 * Shared by the product form (client) and the server actions.
 */
export const PRODUCT_CODE = /^[A-Z]{3}\d{2}[A-Z]\d{3}\d{3}$/;
export const PRODUCT_CODE_LENGTH = 12;

export type CodeSegments = { width: string; lot: string; pattern: string; colour: string };
export const EMPTY_SEGMENTS: CodeSegments = { width: "", lot: "", pattern: "", colour: "" };

/** Length of each editable segment, and the characters it accepts. */
export const SEGMENTS = {
  width: { length: 2, keep: /\D/g },
  lot: { length: 1, keep: /[^A-Za-z]/g },
  pattern: { length: 3, keep: /\D/g },
  colour: { length: 3, keep: /\D/g },
} as const;

/** Cleans what was typed into a segment: allowed characters only, upper case, cut to length. */
export function cleanSegment(segment: keyof CodeSegments, raw: string) {
  const { length, keep } = SEGMENTS[segment];
  return raw.replace(keep, "").toUpperCase().slice(0, length);
}

export const buildCode = (categoryCode: string, s: CodeSegments) => categoryCode + s.width + s.lot + s.pattern + s.colour;

/** Splits a full code into its parts, or null when it doesn't have the format. */
export function splitCode(code: string): { category: string; segments: CodeSegments } | null {
  if (!PRODUCT_CODE.test(code)) return null;
  return {
    category: code.slice(0, 3),
    segments: { width: code.slice(3, 5), lot: code.slice(5, 6), pattern: code.slice(6, 9), colour: code.slice(9, 12) },
  };
}

/** The design's message for what is wrong with the code being built, or "" when complete. */
export function codeProblem(categoryCode: string, s: CodeSegments) {
  if (!categoryCode) return "เลือกหมวดหมู่สินค้าก่อน";
  if (s.width.length !== 2) return "หน้ากว้างต้องเป็นตัวเลข 2 หลัก (นิ้ว)";
  if (s.lot.length !== 1) return "ล็อตต้องเป็นตัวอักษรอังกฤษ 1 ตัว";
  if (s.pattern.length !== 3) return "ลายผ้าต้องเป็นตัวเลข 3 หลัก";
  if (s.colour.length !== 3) return "สีผ้าต้องเป็นตัวเลข 3 หลัก";
  if (!PRODUCT_CODE.test(buildCode(categoryCode, s))) return "รูปแบบรหัสไม่ถูกต้อง";
  return "";
}

export const duplicateProductCode = (code: string) => `รหัส ${code} มีอยู่แล้ว เปลี่ยนล็อต ลาย หรือสี`;
export const codeCategoryMismatch = (categoryCode: string) => `3 ตัวแรกของรหัสต้องเป็นรหัสหมวดหมู่ ${categoryCode}`;
