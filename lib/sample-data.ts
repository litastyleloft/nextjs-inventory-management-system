/**
 * Sample data and helpers ported from design/src/data/*.js (the window.LTS
 * object shared by the design pages). Same records, same maths.
 *
 * Ported so far: what the dashboard needs. Billing notes, transfers, suppliers,
 * expense categories and the permission catalogue are still only in design/src/data.
 */

export const r2 = (x: number) => Math.round(x * 100) / 100;

/* ---------------------------------------------------------------- products */
export type Product = {
  code: string; name: string; unit: string; price: number; cost: number;
  stock: number; alert: number; roll: number; swatch: string;
};

export const PRODUCTS: Product[] = [
  { code: "COT58A101001", name: "ผ้าคอตตอนป๊อปลิน 60s สีขาวออปติก", unit: "yard", price: 78, cost: 57, stock: 2680, alert: 330, roll: 110, swatch: "poplin" },
  { code: "DEN58A201014", name: "ผ้ายีนส์ยืด 10 ออนซ์ สีคราม", unit: "yard", price: 165, cost: 128, stock: 1290, alert: 220, roll: 110, swatch: "denim" },
  { code: "VIS44B305022", name: "ผ้าเรยอนพิมพ์ลายดอกไม้", unit: "yard", price: 110, cost: 87, stock: 700, alert: 165, roll: 110, swatch: "floral" },
  { code: "PLY58A410012", name: "ผ้าจอร์เจ็ตโพลีเอสเตอร์ สีกรมท่า", unit: "yard", price: 60, cost: 44, stock: 82, alert: 110, roll: 110, swatch: "georgette" },
  { code: "LIN54C120003", name: "ผ้าลินินผสมฝ้าย สีธรรมชาติ", unit: "yard", price: 238, cost: 192, stock: 0, alert: 90, roll: 110, swatch: "linen" },
  { code: "KNT72A160008", name: "ผ้ายืดซิงเกิลเจอร์ซีย์ 160 แกรม สีเทาท็อปดราย", unit: "yard", price: 120, cost: 95, stock: 350, alert: 60, roll: 90, swatch: "jersey" },
];

export const product = (code: string) => PRODUCTS.find((p) => p.code === code)!;

const CATEGORY: Record<string, string> = { COT: "ผ้าฝ้าย", DEN: "ผ้ายีนส์", VIS: "ผ้าเรยอน", PLY: "ผ้าโพลีเอสเตอร์", LIN: "ผ้าลินิน", KNT: "ผ้ายืด" };
export const categoryOf = (code: string) => CATEGORY[code.slice(0, 3)] ?? "อื่น ๆ";

/* ------------------------------------------------------------ line maths */
export type Line = {
  code: string; price: number; disc: number; discType: "fixed" | "percent";
  tax: number; taxType: "exclusive" | "inclusive"; qty: number; unit: string;
};

export function calc(l: Line) {
  const price = +l.price || 0, q = +l.qty || 0, t = (+l.tax || 0) / 100;
  const d = l.discType === "percent" ? (price * (+l.disc || 0)) / 100 : +l.disc || 0;
  const after = Math.max(0, price - d);
  let net: number, taxU: number;
  if (l.taxType === "inclusive") { net = after / (1 + t); taxU = after - net; } else { net = after; taxU = after * t; }
  return { net: r2(net), taxU: r2(taxU), unitTotal: r2(net + taxU), sub: r2((net + taxU) * q), discT: r2(d * q), taxT: r2(taxU * q), d: r2(d) };
}

type Doc = { lines: Line[]; orderTax: number; discount: number; shipping: number };

export function totals(rec: Doc) {
  const sub = r2(rec.lines.reduce((s, l) => s + calc(l).sub, 0));
  const disc = Math.min(+rec.discount || 0, sub);
  const tax = r2(((sub - disc) * (+rec.orderTax || 0)) / 100);
  const ship = +rec.shipping || 0;
  return { sub, disc, tax, ship, grand: r2(sub - disc + tax + ship) };
}

const L = (code: string, qty: number): Line => ({
  code, price: product(code).price, disc: 0, discType: "fixed", tax: 0, taxType: "exclusive", qty, unit: "",
});

/* --------------------------------------------------------------- regions */
const PROVINCES: Record<string, string> = {
  /* การแบ่ง 6 ภาค: กรุงเทพฯ และปริมณฑลนับเป็นภาคกลาง */
  "ภาคกลาง": "กรุงเทพมหานคร กรุงเทพฯ กรุงเทพ นนทบุรี ปทุมธานี สมุทรปราการ สมุทรสาคร นครปฐม รังสิต ปากเกร็ด บางนา บางพลี มหาชัย พระนครศรีอยุธยา อยุธยา อ่างทอง ลพบุรี สิงห์บุรี ชัยนาท สระบุรี นครนายก สมุทรสงคราม สุพรรณบุรี สุโขทัย พิษณุโลก พิจิตร กำแพงเพชร เพชรบูรณ์ นครสวรรค์ อุทัยธานี",
  "ภาคเหนือ": "เชียงใหม่ เชียงราย ลำพูน ลำปาง แพร่ น่าน พะเยา แม่ฮ่องสอน อุตรดิตถ์",
  "ภาคตะวันออกเฉียงเหนือ": "กาฬสินธุ์ ขอนแก่น ชัยภูมิ นครพนม นครราชสีมา โคราช บึงกาฬ บุรีรัมย์ มหาสารคาม มุกดาหาร ยโสธร ร้อยเอ็ด เลย ศรีสะเกษ สกลนคร สุรินทร์ หนองคาย หนองบัวลำภู อุดรธานี อุบลราชธานี อำนาจเจริญ",
  "ภาคตะวันออก": "ชลบุรี ระยอง จันทบุรี ตราด ฉะเชิงเทรา ปราจีนบุรี สระแก้ว พัทยา ศรีราชา",
  "ภาคตะวันตก": "ตาก กาญจนบุรี ราชบุรี เพชรบุรี ประจวบคีรีขันธ์ หัวหิน",
  "ภาคใต้": "ชุมพร ระนอง สุราษฎร์ธานี พังงา ภูเก็ต กระบี่ นครศรีธรรมราช ตรัง พัทลุง สตูล สงขลา หาดใหญ่ ปัตตานี ยะลา นราธิวาส เกาะสมุย",
};

export function regionOf(city?: string, country?: string): string {
  if (country && country !== "ไทย" && country !== "ประเทศไทย") return "ต่างประเทศ";
  const c = String(city || "").replace(/^(จังหวัด|จ\.|อำเภอ|อ\.|เขต)\s*/, "").replace(/\s+/g, "");
  if (!c) return "";
  for (const r in PROVINCES) {
    for (const n of PROVINCES[r].split(" ")) {
      if (c === n || c.indexOf(n) >= 0 || (c.length >= 3 && n.indexOf(c) === 0)) return r;
    }
  }
  return "";
}

/* ------------------------------------------------------------- customers */
export type Customer = {
  id: string; name: string; initials: string; phone: string; email: string; address: string;
  terms: number; city: string; country?: string; dob?: string; created?: string; walkIn?: boolean; region: string;
};

// sales-data.js records, merged with people-data.js EXTRA (which overrides city etc.)
export const CUSTOMERS: Customer[] = [
  { id: "C1", name: "ร้านผ้าสยามแฟชั่น", initials: "สฟ", phone: "081-234-5678", email: "order@siamfashion.example", address: "45/12 ถนนจักรวรรดิ แขวงจักรวรรดิ เขตสัมพันธวงศ์ กรุงเทพฯ 10100", terms: 30, country: "ไทย", city: "กรุงเทพฯ", dob: "", created: "2025-11-04T11:52" },
  { id: "C2", name: "บริษัท ไทยการ์เมนท์ จำกัด", initials: "ทก", phone: "02-456-7890", email: "purchasing@thaigarment.example", address: "99 หมู่ 2 นิคมอุตสาหกรรมบางปู ต.แพรกษา อ.เมือง จ.สมุทรปราการ 10280", terms: 45, country: "ไทย", city: "สมุทรปราการ", dob: "", created: "2025-12-20T09:30" },
  { id: "C3", name: "ห้องเสื้อมาลัย", initials: "มล", phone: "089-765-4321", email: "malai@malai-atelier.example", address: "12 ถนนนิมมานเหมินท์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200", terms: 15, country: "ไทย", city: "เชียงใหม่", dob: "1984-06-12", created: "2026-02-08T15:18" },
  { id: "C4", name: "ลูกค้าหน้าร้าน", initials: "หร", phone: "02-123-4567", email: "pos@lts-solution.example", address: "ขายหน้าร้าน (ไม่ระบุที่อยู่)", terms: 0, country: "ไทย", city: "กรุงเทพฯ", dob: "", created: "2025-10-01T08:00", walkIn: true },
  { id: "C5", name: "ร้านผ้าขอนแก่นพาณิชย์", initials: "ขพ", phone: "043-221-554", email: "sales@khonkaenfabric.example", address: "210 ถนนหน้าเมือง ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000", terms: 30, country: "ไทย", city: "ขอนแก่น", dob: "", created: "2026-09-12T10:00" },
  { id: "C6", name: "หาดใหญ่แฟบริค", initials: "หฟ", phone: "074-355-120", email: "order@hatyaifabric.example", address: "58 ถนนนิพัทธ์อุทิศ 3 อ.หาดใหญ่ จ.สงขลา 90110", terms: 30, country: "ไทย", city: "สงขลา", dob: "", created: "2026-09-28T13:30" },
].map((c) => ({ ...c, region: regionOf(c.city, c.country) }));

export const customer = (id: string) => CUSTOMERS.find((c) => c.id === id)!;

/* ------------------------------------------------------- users and roles */
export const ROLES = [
  { id: "admin", name: "ผู้ดูแลระบบ" },
  { id: "manager", name: "ผู้จัดการ" },
  { id: "sales", name: "พนักงานขาย" },
  { id: "stock", name: "พนักงานคลังสินค้า" },
];
export const role = (id: string) => ROLES.find((r) => r.id === id);

export const USERS = [
  { id: "U1", first: "แอดมิน", last: "ระบบ", email: "admin@lts-solution.example", phone: "081-000-1111", role: "admin" },
  { id: "U2", first: "สมชาย", last: "ใจดี", email: "somchai@lts-solution.example", phone: "089-555-1234", role: "manager" },
  { id: "U3", first: "วนิดา", last: "ศรีสุข", email: "wanida@lts-solution.example", phone: "086-223-4410", role: "sales" },
  { id: "U4", first: "ประเสริฐ", last: "ทองมา", email: "prasert@lts-solution.example", phone: "092-781-6650", role: "stock" },
  { id: "U5", first: "กมลชนก", last: "แก้วใส", email: "kamon@lts-solution.example", phone: "095-114-7720", role: "sales" },
];

/** First letter for an avatar, skipping Thai leading vowels (เ แ โ ใ ไ). */
export const ch = (s: string) => String(s || "").replace(/^[เ-ไ]/, "").charAt(0);

/* ----------------------------------------------------------------- sales */
export const AGENTS = [{ id: "U3", name: "วนิดา ศรีสุข" }, { id: "U5", name: "กมลชนก แก้วใส" }, { id: "U2", name: "สมชาย ใจดี" }];
const AGENT_OF: Record<string, string> = { C1: "U3", C2: "U2", C3: "U5", C4: "U5", C5: "U3", C6: "U2" };
export const agent = (id: string) => AGENTS.find((a) => a.id === id) ?? { id, name: "—" };

export type Payment = { date: string; amount: number; method: string; note: string };
export type Sale = Doc & {
  ref: string; created: string; customer: string; status: string; method: string; notes: string;
  agent: string; terms: number; payments: Payment[];
};

type SaleRow = [string, string, string, [string, number][], "paid" | number, string, string];
/* [ref, date, customer, lines, payment: 'paid' | number paid | 0, status, method] */
const RAW_SALES: SaleRow[] = [
  ["SA_11032", "2026-01-14T10:20", "C1", [["COT58A101001", 150], ["VIS44B305022", 60]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11048", "2026-03-02T14:05", "C1", [["DEN58A201014", 100]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11061", "2026-04-18T11:40", "C1", [["COT58A101001", 200], ["PLY58A410012", 80]], "paid", "delivered", "เงินสด"],
  ["SA_11077", "2026-06-05T09:55", "C1", [["VIS44B305022", 90], ["LIN54C120003", 25]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11086", "2026-07-11T15:30", "C1", [["DEN58A201014", 60], ["COT58A101001", 120]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11094", "2026-08-02T10:10", "C1", [["KNT72A160008", 40], ["VIS44B305022", 70]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11102", "2026-08-18T13:45", "C1", [["COT58A101001", 180]], "paid", "delivered", "เงินสด"],
  ["SA_11109", "2026-08-30T11:00", "C1", [["DEN58A201014", 80], ["PLY58A410012", 60]], 8000, "delivered", "โอนผ่านธนาคาร"],
  ["SA_11117", "2026-09-14T16:20", "C1", [["VIS44B305022", 110]], 0, "delivered", "เครดิต"],
  ["SA_11125", "2026-09-26T10:35", "C1", [["COT58A101001", 100]], 0, "delivered", "เครดิต"],
  ["SA_11131", "2026-10-03T14:50", "C1", [["LIN54C120003", 40], ["COT58A101001", 40]], 10000, "delivered", "โอนผ่านธนาคาร"],
  ["SA_11138", "2026-10-12T09:15", "C1", [["DEN58A201014", 85], ["KNT72A160008", 10]], 0, "delivered", "เครดิต"],
  ["SA_11139", "2026-10-14T11:25", "C2", [["KNT72A160008", 120]], 0, "delivered", "เครดิต"],
  ["SA_11140", "2026-10-16T10:41", "C3", [["VIS44B305022", 40]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11141", "2026-10-17T22:41", "C4", [["COT58A101001", 30]], "paid", "delivered", "เงินสด"],
  ["SA_11142", "2026-10-19T22:37", "C2", [["DEN58A201014", 200], ["COT58A101001", 150]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11143", "2026-10-20T22:38", "C3", [["LIN54C120003", 15], ["PLY58A410012", 20]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11144", "2026-10-22T22:38", "C4", [["PLY58A410012", 12]], "paid", "delivered", "เงินสด"],
  ["SA_11145", "2026-10-23T14:10", "C2", [["KNT72A160008", 80]], 15000, "delivered", "โอนผ่านธนาคาร"],
  ["SA_11146", "2026-10-24T13:20", "C3", [["VIS44B305022", 50], ["COT58A101001", 25]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11147", "2026-10-26T11:05", "C4", [["DEN58A201014", 10]], "paid", "delivered", "เงินสด"],
  ["SA_11148", "2026-10-27T16:45", "C2", [["COT58A101001", 300], ["VIS44B305022", 100]], 0, "pending", "เครดิต"],
  ["SA_11149", "2026-10-29T01:02", "C3", [["DEN58A201014", 30], ["LIN54C120003", 10], ["KNT72A160008", 5]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11150", "2026-10-30T10:30", "C5", [["COT58A101001", 220], ["VIS44B305022", 80]], 0, "delivered", "เครดิต"],
  ["SA_11151", "2026-10-31T14:05", "C6", [["DEN58A201014", 120]], "paid", "delivered", "โอนผ่านธนาคาร"],
  ["SA_11152", "2026-11-02T11:15", "C5", [["KNT72A160008", 90]], 5000, "delivered", "เครดิต"],
  ["SA_11153", "2026-11-03T16:40", "C6", [["PLY58A410012", 40], ["COT58A101001", 150]], 0, "pending", "เครดิต"],
  ["SA_11154", "2026-11-04T10:05", "C1", [["VIS44B305022", 60]], 0, "delivered", "เครดิต"],
  ["SA_11155", "2026-11-05T09:20", "C4", [["COT58A101001", 12]], "paid", "delivered", "เงินสด"],
];

export const SALES: Sale[] = RAW_SALES.map(([ref, created, cust, lines, pay, status, method]) => {
  const base = { lines: lines.map(([c, q]) => L(c, q)), orderTax: 7, discount: 0, shipping: 0 };
  const g = totals(base).grand;
  const paid = pay === "paid" ? g : pay;
  return {
    ...base, ref, created, customer: cust, status, method, notes: "",
    agent: AGENT_OF[cust] ?? "U3",
    terms: paid >= g ? 0 : customer(cust).terms || 30,
    payments: paid
      ? [{ date: created.slice(0, 10), amount: paid, method: method === "เครดิต" ? "โอนผ่านธนาคาร" : method, note: paid >= g ? "ชำระเต็มจำนวน" : "ชำระบางส่วน" }]
      : [],
  };
});

export const paidOf = (s: Sale) => r2(s.payments.reduce((a, p) => a + p.amount, 0));
export const payState = (total: number, paid: number) => (paid >= total - 0.005 ? "paid" : paid > 0 ? "partial" : "unpaid");

/* [ref, created, saleRef, lines, status, refunded: 'paid' | number] */
export const RETURNS = ([
  ["SR_1116", "2026-10-28T13:21", "SA_11147", [["DEN58A201014", 2]], "pending", 0],
  ["SR_1115", "2026-10-26T10:12", "SA_11146", [["VIS44B305022", 5]], "received", 0],
  ["SR_1114", "2026-10-23T15:40", "SA_11144", [["PLY58A410012", 2]], "received", "paid"],
  ["SR_1113", "2026-10-21T09:30", "SA_11143", [["LIN54C120003", 3]], "received", 0],
  ["SR_1112", "2026-10-20T22:41", "SA_11142", [["DEN58A201014", 15], ["COT58A101001", 10]], "received", "paid"],
  ["SR_1111", "2026-10-17T22:39", "SA_11140", [["VIS44B305022", 4]], "received", 0],
] as [string, string, string, [string, number][], string, "paid" | number][]).map(([ref, created, sale, lines, status, refunded]) => {
  const rec = {
    ref, created, sale, customer: SALES.find((s) => s.ref === sale)!.customer,
    lines: lines.map(([c, q]) => L(c, q)), orderTax: 7, discount: 0, shipping: 0, status, notes: "",
  };
  return { ...rec, refunded: refunded === "paid" ? totals(rec).grand : refunded };
});

/** Badge tone + label per status. */
export const STATUS: Record<string, [string, string]> = {
  delivered: ["success", "ส่งมอบแล้ว"], pending: ["warning", "รอดำเนินการ"], ordered: ["neutral", "สั่งจองแล้ว"], received: ["info", "รับคืนแล้ว"],
};
export const PAY: Record<string, [string, string]> = {
  paid: ["success", "ชำระแล้ว"], partial: ["warning", "ชำระบางส่วน"], unpaid: ["danger", "ค้างชำระ"],
};

/* ------------------------------------------------------ warehouses/stock */
export const WAREHOUSES = [
  { id: "W1", name: "คลังสินค้าหลัก", city: "กรุงเทพฯ" },
  { id: "W2", name: "คลังบางนา", city: "สมุทรปราการ" },
  { id: "W3", name: "หน้าร้านพาหุรัด", city: "กรุงเทพฯ" },
];
/** On-hand stock per warehouse, in each fabric's stock unit. */
const STOCK: Record<string, Record<string, number>> = {
  COT58A101001: { W1: 2680, W2: 1200, W3: 180 },
  DEN58A201014: { W1: 1290, W2: 600, W3: 95 },
  VIS44B305022: { W1: 700, W2: 300, W3: 120 },
  PLY58A410012: { W1: 82, W2: 420, W3: 40 },
  LIN54C120003: { W1: 0, W2: 160, W3: 12 },
  KNT72A160008: { W1: 350, W2: 75, W3: 0 },
};
export const stockAt = (code: string, w: string) => STOCK[code]?.[w] ?? 0;

/* -------------------------------------------------------------- expenses */
export const EXPENSES = ([
  ["EX_1114", "2026-10-29T23:52", "เงินเดือนพนักงานคลัง ต.ค.", "W1", "K1", 86000, "พนักงานคลัง 5 คน"],
  ["EX_1113", "2026-10-28T23:51", "ค่าโฆษณาไลฟ์ขายผ้าลายใหม่", "W3", "K6", 12500, "Boost โพสต์ 3 วัน"],
  ["EX_1112", "2026-10-25T15:05", "ค่าเช่าโกดังบางนา ต.ค.", "W2", "K2", 45000, ""],
  ["EX_1111", "2026-10-24T15:04", "ค่าขนส่งผ้าไปเชียงใหม่", "W1", "K3", 3800, "ส่งให้ห้องเสื้อมาลัย"],
  ["EX_1110", "2026-10-21T10:20", "ค่าไฟฟ้าโกดังหลัก", "W1", "K4", 9650.5, ""],
  ["EX_1109", "2026-10-18T14:10", "ถุงพลาสติกและแกนกระดาษม้วนผ้า", "W3", "K5", 4200, "500 ถุง + แกน 40 ชิ้น"],
  ["EX_1108", "2026-10-15T09:30", "เปลี่ยนใบมีดเครื่องตัดผ้า", "W1", "K8", 2750, ""],
  ["EX_1107", "2026-10-12T17:45", "ค่าน้ำมันรถส่งของ", "W2", "K7", 1850, ""],
  ["EX_1106", "2026-10-05T11:00", "ค่าเช่าหน้าร้านพาหุรัด ต.ค.", "W3", "K2", 28000, ""],
  ["EX_1105", "2026-09-30T23:40", "เงินเดือนพนักงานคลัง ก.ย.", "W1", "K1", 86000, ""],
  ["EX_1104", "2026-09-26T10:15", "ค่าขนส่งผ้าเข้าโกดังบางนา", "W2", "K3", 2400, ""],
  ["EX_1103", "2026-09-20T13:25", "ค่าน้ำประปาหน้าร้าน", "W3", "K4", 640, ""],
  ["EX_1102", "2026-09-14T16:00", "ค่าโฆษณาไลฟ์ผ้ายีนส์", "W3", "K6", 8000, ""],
  ["EX_1101", "2026-09-03T09:05", "ค่าธรรมเนียมโอนเงินต่างธนาคาร", "W1", "K9", 175, ""],
] as [string, string, string, string, string, number, string][]).map(([ref, created, title, warehouse, category, amount, details]) => ({
  ref, created, title, warehouse, category, amount, details,
}));

/* ------------------------------------------------------------- purchases */
export type PurchaseLine = { code: string; qty: number; cost: number; sub: number };

/* [ref, supplierId, status, paid, method, created, shipping, warehouse, lines [code, qty, cost]] */
export const PURCHASES = ([
  ["PU_1119", "S1", "pending", 0, "เงินสด", "2026-10-04T00:25", 180, "W1", [["VIS44B305022", 50, 95]]],
  ["PU_1118", "S1", "received", 2220, "เงินสด", "2026-10-03T23:52", 0, "W1", [["COT58A101001", 30, 62], ["PLY58A410012", 7.5, 48]]],
  ["PU_1117", "S3", "received", 100000, "เงินสด", "2026-10-03T23:40", 0, "W2", [["DEN58A201014", 1000, 162]]],
  ["PU_1116", "S2", "received", 45000, "เงินสด", "2026-10-03T23:31", 0, "W2", [["KNT72A160008", 180, 250]]],
  ["PU_1115", "S1", "received", 49300, "เงินสด", "2026-10-03T23:23", 0, "W1", [["LIN54C120003", 200, 210], ["VIS44B305022", 73, 100]]],
  ["PU_1114", "S3", "ordered", 0, "เงินสด", "2026-10-03T23:15", 0, "W2", [["DEN58A201014", 450, 143]]],
  ["PU_1113", "S1", "received", 30260, "เงินสด", "2026-10-03T23:12", 0, "W1", [["COT58A101001", 445, 68]]],
  ["PU_1112", "S1", "received", 1620, "เงินสด", "2026-10-03T23:02", 0, "W3", [["PLY58A410012", 36, 45]]],
  ["PU_1111", "S2", "received", 95000, "เงินสด", "2026-10-02T23:08", 0, "W2", [["KNT72A160008", 380, 250]]],
] as [string, string, string, number, string, string, number, string, [string, number, number][]][]).map(
  ([ref, supplier, status, paid, method, created, shipping, warehouse, raw]) => {
    const lines: PurchaseLine[] = raw.map(([code, qty, cost]) => ({ code, qty, cost, sub: r2(qty * cost) }));
    return { ref, supplier, status, paid, method, created, shipping, warehouse, lines, total: r2(lines.reduce((a, l) => a + l.sub, 0) + shipping) };
  },
);

/* [ref, created, purchaseRef, lines [code, qty], status, refunded] */
export const PRETURNS = ([
  ["PR_1104", "2026-10-10T10:20", "PU_1117", [["DEN58A201014", 25]], "received", "paid"],
  ["PR_1103", "2026-10-08T15:05", "PU_1115", [["LIN54C120003", 12]], "received", "paid"],
  ["PR_1102", "2026-10-06T11:30", "PU_1113", [["COT58A101001", 15]], "pending", 0],
  ["PR_1101", "2026-10-05T09:45", "PU_1116", [["KNT72A160008", 6]], "received", "paid"],
] as [string, string, string, [string, number][], string, "paid" | number][]).map(([ref, created, purchase, raw, status, refunded]) => {
  const pu = PURCHASES.find((p) => p.ref === purchase)!;
  const lines: PurchaseLine[] = raw.map(([code, qty]) => {
    const cost = pu.lines.find((x) => x.code === code)!.cost;
    return { code, qty, cost, sub: r2(qty * cost) };
  });
  const total = r2(lines.reduce((a, l) => a + l.sub, 0));
  return { ref, created, purchase, supplier: pu.supplier, warehouse: pu.warehouse, lines, status, total, refunded: refunded === "paid" ? total : refunded };
});

/* ------------------------------------------------------------ formatting */
/** Money in Thai baht: ฿71,800.00 */
export const baht = (n: number) => "฿" + Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = (x: number) => Number(x).toLocaleString("th-TH", { maximumFractionDigits: 2 });

/** Local date as YYYY-MM-DD. */
export function isoDate(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
