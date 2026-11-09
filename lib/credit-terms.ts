/**
 * Customer credit terms and the billing-date rule.
 *
 * Terms are "cash" or a whole number of months ("1m" … "12m"). A credit purchase is
 * billed on the 5th (BILLING_DAY) of the month that is N months after the month of
 * purchase, whatever the day of purchase. Example: bought 15 Jan on 4 months → billed
 * 5 May. Every purchase in January on 4 months is billed on 5 May.
 *
 * Use billingDateFor() wherever a billing date is needed (sales, and the Billing Notes
 * page when it is built) so the rule lives in exactly one place.
 */

/** Day of the month on which credit purchases are billed. */
export const BILLING_DAY = 5;

export const CREDIT_TERMS = ["cash", ...Array.from({ length: 12 }, (_, i) => `${i + 1}m`)] as const;
export type CreditTerm = (typeof CREDIT_TERMS)[number];

export const isCreditTerm = (v: string): v is CreditTerm => (CREDIT_TERMS as readonly string[]).includes(v);

/** Months of credit for a term; 0 for cash. */
export function creditMonths(term: CreditTerm): number {
  return term === "cash" ? 0 : Number(term.slice(0, -1));
}

export function creditTermLabel(term: string): string {
  if (term === "cash") return "เงินสด / ชำระทันที";
  return `เครดิต ${term.replace("m", "")} เดือน`;
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export const thaiMonth = (month1to12: number) => THAI_MONTHS[month1to12 - 1];

/** The calendar day of an instant in Bangkok, as "YYYY-MM-DD". A sale at 23:30 Bangkok time is that day, not the next UTC day. */
export function bangkokDay(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(instant);
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The billing date for a purchase made on `purchaseDay` ("YYYY-MM-DD", the Bangkok
 * calendar day) on `term`. Cash is billed the same day; N months is billed on BILLING_DAY
 * (the 5th) of the month N months after the purchase month. Returns "YYYY-MM-DD".
 */
export function billingDateFor(purchaseDay: string, term: CreditTerm): string {
  const m = DAY.exec(purchaseDay);
  if (!m) throw new Error(`Invalid purchase day "${purchaseDay}" (expected YYYY-MM-DD)`);
  if (!isCreditTerm(term)) throw new Error(`Unknown credit term "${term}"`);
  const months = creditMonths(term);
  if (months === 0) return purchaseDay;

  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1 + months; // 0-based, may run past December
  const billYear = year + Math.floor(monthIndex / 12);
  const billMonth = (monthIndex % 12) + 1;
  return `${billYear}-${String(billMonth).padStart(2, "0")}-${String(BILLING_DAY).padStart(2, "0")}`;
}

/** Same rule for an instant (e.g. a sale's createdAt), using its Bangkok calendar day. */
export function billingDateForInstant(purchasedAt: Date, term: CreditTerm): string {
  return billingDateFor(bangkokDay(purchasedAt), term);
}
