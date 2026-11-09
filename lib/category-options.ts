/**
 * Choices for the category form's fabric fields, from the selects in
 * design/src/pages/categories.page.html. Safe to import in client components.
 */

export const WEAVES = [
  "ทอธรรมดา (Plain)",
  "ทอลายสอง (Twill)",
  "ซาติน (Satin)",
  "ด็อบบี้ (Dobby)",
  "แจ็คการ์ด (Jacquard)",
  "เครป / จอร์เจ็ต",
  "ถักซิงเกิลเจอร์ซีย์",
  "ถักริบ (Rib)",
  "ถักอินเตอร์ล็อค",
] as const;

export const PATTERNS = ["สีพื้น", "พิมพ์ลาย", "ย้อมเส้นด้าย", "ลายทาง", "ลายตาราง", "ปัก"] as const;

/** Category code: exactly three letters A–Z, used as the "AAA" part of product codes. */
export const CATEGORY_CODE = /^[A-Z]{3}$/;
