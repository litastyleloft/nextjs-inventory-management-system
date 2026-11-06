// The figures behind the dashboard: the maths from render() in
// design/src/pages/dashboard.page.html, as pure functions.

import * as D from "@/lib/sample-data";

export type Period = "month" | "30" | "year" | "all";
export const PLABEL: Record<Period, string> = { month: "เดือนนี้", "30": "30 วันล่าสุด", year: "ปีนี้", all: "ทั้งหมด" };

export const money = (v: number) => (v < 0 ? "−" : "") + D.baht(Math.abs(v));

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00");
  d.setDate(d.getDate() + n);
  return D.isoDate(d);
}

function inPeriod(iso: string, p: Period, today: string) {
  const d = iso.slice(0, 10);
  if (p === "all") return true;
  if (p === "month") return d.slice(0, 7) === today.slice(0, 7);
  if (p === "year") return d.slice(0, 4) === today.slice(0, 4) && d <= today;
  return d >= addDays(today, -29) && d <= today;
}

/* Purchase price per yard: weighted average of received purchase lines; product cost only if never purchased */
const BUY: Record<string, { q: number; v: number }> = {};
for (const pu of D.PURCHASES) {
  if (pu.status !== "received") continue;
  for (const l of pu.lines) {
    const b = (BUY[l.code] ??= { q: 0, v: 0 });
    b.q += +l.qty;
    b.v += l.qty * l.cost;
  }
}
const buyPrice = (code: string) => (BUY[code]?.q ? BUY[code].v / BUY[code].q : D.product(code).cost);
/* Selling price = line price per yard after line discount, before VAT; purchase price = buyPrice × yards */
const sellValue = (s: D.Sale) => D.r2(s.lines.reduce((a, l) => a + D.calc(l).net * +l.qty, 0));
const buyValue = (s: D.Sale) => D.r2(s.lines.reduce((a, l) => a + buyPrice(l.code) * +l.qty, 0));

export function compute(period: Period, today: string) {
  const inP = (iso: string) => inPeriod(iso, period, today);
  const S = D.SALES.filter((s) => inP(s.created));
  const P = D.PURCHASES.filter((p) => inP(p.created));
  const E = D.EXPENSES.filter((e) => inP(e.created));
  const SR = D.RETURNS.filter((r) => inP(r.created));
  const PR = D.PRETURNS.filter((r) => inP(r.created));

  const sales = D.r2(S.reduce((a, s) => a + D.totals(s).grand, 0));
  const purchase = D.r2(P.reduce((a, p) => a + p.total, 0));
  const exp = D.r2(E.reduce((a, e) => a + e.amount, 0));
  const gross = D.r2(sales - purchase);
  const net = D.r2(sales - purchase - exp);
  const due = D.r2(D.SALES.reduce((a, s) => a + D.totals(s).grand - D.paidOf(s), 0));
  const returnsIn = SR.reduce((a, r) => a + D.totals(r).grand, 0);
  const returnsOut = PR.reduce((a, r) => a + r.total, 0);

  /* monthly trend for the current year */
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = today.slice(0, 4) + "-" + String(i + 1).padStart(2, "0");
    const at = (iso: string) => iso.slice(0, 7) === key;
    const sv = D.SALES.filter((s) => at(s.created)).reduce((a, s) => a + D.totals(s).grand, 0);
    const pv = D.PURCHASES.filter((p) => at(p.created)).reduce((a, p) => a + p.total, 0);
    const ev = D.EXPENSES.filter((e) => at(e.created)).reduce((a, e) => a + e.amount, 0);
    return { s: D.r2(sv), p: D.r2(pv), n: D.r2(sv - pv - ev) };
  });

  /* top selling category */
  const cat: Record<string, number> = {};
  for (const s of S) for (const l of s.lines) { const k = D.categoryOf(l.code); cat[k] = (cat[k] || 0) + D.calc(l).sub; }
  const cats = Object.keys(cat).map((k) => ({ k, v: D.r2(cat[k]) })).sort((a, b) => b.v - a.v);
  const catTotal = cats.reduce((a, x) => a + x.v, 0);

  /* sales agents */
  const agents = D.AGENTS.map((a) => {
    const l = S.filter((s) => s.agent === a.id);
    const tot = D.r2(l.reduce((x, s) => x + D.totals(s).grand, 0));
    const sell = D.r2(l.reduce((x, s) => x + sellValue(s), 0));
    const cost = D.r2(l.reduce((x, s) => x + buyValue(s), 0));
    const u = D.USERS.find((u) => u.id === a.id);
    return {
      id: a.id, name: a.name, n: l.length, tot, sell, cost, gp: D.r2(sell - cost), m: sell ? ((sell - cost) / sell) * 100 : 0,
      ini: u ? D.ch(u.first) + D.ch(u.last) : a.name.slice(0, 2),
      role: u ? D.role(u.role)?.name ?? "" : "",
    };
  }).sort((x, y) => y.tot - x.tot);
  const agentTotal = agents.reduce(
    (a, x) => ({ n: a.n + x.n, tot: a.tot + x.tot, sell: a.sell + x.sell, cost: a.cost + x.cost, gp: a.gp + x.gp }),
    { n: 0, tot: 0, sell: 0, cost: 0, gp: 0 },
  );

  /* regions */
  const R: Record<string, { v: number; n: number; c: Set<string> }> = {};
  for (const s of S) {
    const c = D.customer(s.customer), k = c.region || "ไม่ระบุภาค";
    R[k] ??= { v: 0, n: 0, c: new Set() };
    R[k].v += D.totals(s).grand;
    R[k].n++;
    R[k].c.add(c.id);
  }
  const regions = Object.keys(R).map((k) => ({ k, v: D.r2(R[k].v), n: R[k].n, c: R[k].c.size })).sort((a, b) => b.v - a.v);
  const regTotal = regions.reduce((a, x) => a + x.v, 0);
  const regMax = regions.length ? regions[0].v : 1;

  return {
    headSub: `ภาพรวม${PLABEL[period]} · ${S.length} บิลขาย · ${P.length} ใบสั่งซื้อ · ${E.length} รายการค่าใช้จ่าย`,
    S, P, E, SR, PR, sales, purchase, exp, gross, net, due, returnsIn, returnsOut,
    months, cats, catTotal, agents, agentTotal, regions, regTotal, regMax,
  };
}

/* Recent sales and stock alerts do not depend on the period. */
export const RECENT = [...D.SALES].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 6);
export const ALERTS = D.PRODUCTS.flatMap((p) =>
  D.WAREHOUSES.filter((w) => w.id === "W1" && D.stockAt(p.code, w.id) <= p.alert).map((w) => ({ p, w, q: D.stockAt(p.code, w.id) })),
);
