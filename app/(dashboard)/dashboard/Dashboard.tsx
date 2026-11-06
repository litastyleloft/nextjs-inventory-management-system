"use client";

// React port of design/src/pages/dashboard.page.html (===CONTENT=== + ===JS===).
// The figures come from compute.ts; the period <select> is React state.

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { io } from "next/cache";
import {
  Banknote, Calendar, ChartColumn, ChevronDown, ChevronRight, Receipt, Redo2,
  ShoppingCart, TrendingUp, Undo2, Wallet, type LucideIcon,
} from "lucide-react";
import * as D from "@/lib/sample-data";
import { ALERTS, PLABEL, RECENT, compute, money, type Period } from "./compute";
import { AgentChart, CategoryChart, COLOR_VARS, TrendChart } from "./DashboardCharts";

function Badge({ t, dot = true }: { t: [string, string]; dot?: boolean }) {
  return (
    <span className={`gg-badge ${t[0]}`}>
      {dot && <span className="gg-badge-dot" aria-hidden="true" />}
      {t[1]}
    </span>
  );
}

function Tile({ cls, icon: Icon, label, value, formula }: { cls: string; icon: LucideIcon; label: string; value: string; formula?: string }) {
  return (
    <div className={`gg-stat ${cls}`}>
      <div className="gg-stat-icon"><Icon className="gg-icon lg" aria-hidden /></div>
      <div className="gg-stat-body">
        <div className="gg-stat-label">{label}</div>
        <div className="gg-stat-value">{value}</div>
        {formula && <div className="formula">{formula}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  use(io()); // "today" is read from the clock, so this renders per request, not into the static shell
  const [today] = useState(() => D.isoDate(new Date()));
  const [period, setPeriod] = useState<Period>("year");
  const v = useMemo(() => compute(period, today), [period, today]);
  const pct = (x: number, total: number) => (total ? ((x / total) * 100).toFixed(1) : 0) + "%";

  return (
    <div className="lts-dashboard">
      <div className="gg-pagehead">
        <div>
          <h1 className="gg-pagehead-title">แดชบอร์ด</h1>
          <p className="gg-pagehead-sub">{v.headSub}</p>
        </div>
        <div className="gg-pagehead-actions period">
          <div className="gg-control">
            <span className="gg-lead"><Calendar className="gg-icon sm" aria-hidden /></span>
            <select aria-label="ช่วงเวลา" style={{ paddingLeft: 8 }} value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              <option value="month">เดือนนี้</option>
              <option value="30">30 วันล่าสุด</option>
              <option value="year">ปีนี้</option>
              <option value="all">ทั้งหมด</option>
            </select>
            <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
          </div>
        </div>
      </div>

      <div className="dash">
        {/* Profit */}
        <div className="gg-stat-grid tiles">
          <Tile cls="strong navy" icon={Receipt} label="ยอดขาย" value={D.baht(v.sales)} formula={`${v.S.length} บิล`} />
          <Tile cls="strong gold" icon={ShoppingCart} label="ยอดซื้อ" value={D.baht(v.purchase)} formula={`${v.P.length} ใบสั่งซื้อ`} />
          <Tile cls={`strong ${v.gross < 0 ? "loss" : "teal"}`} icon={TrendingUp} label="กำไรขั้นต้น" value={money(v.gross)} formula="ยอดขาย − ยอดซื้อ" />
          <Tile cls={`strong ${v.net < 0 ? "loss" : "teal"}`} icon={ChartColumn} label="กำไรสุทธิ" value={money(v.net)} formula="ยอดขาย − ยอดซื้อ − ค่าใช้จ่าย" />
        </div>
        <div className="gg-stat-grid tiles">
          <Tile cls="soft rose" icon={Wallet} label="ค่าใช้จ่าย" value={D.baht(v.exp)} formula={`${v.E.length} รายการ`} />
          <Tile cls="soft navy" icon={Undo2} label="รับคืนสินค้า" value={D.baht(v.returnsIn)} formula={`${v.SR.length} ใบ`} />
          <Tile cls="soft gold" icon={Redo2} label="คืนสินค้าให้ผู้จำหน่าย" value={D.baht(v.returnsOut)} formula={`${v.PR.length} ใบ`} />
          <Tile cls="soft teal" icon={Banknote} label="ยอดค้างรับจากลูกค้า" value={D.baht(v.due)} formula="ทุกบิลที่ยังไม่ชำระครบ" />
        </div>

        {/* Trend + category */}
        <div className="dash-row">
          <section className="gg-card">
            <div className="gg-card-head"><div>
              <h2 className="gg-card-title">ยอดขาย ยอดซื้อ และกำไรสุทธิรายเดือน</h2>
              <p className="gg-card-sub">ปี 2569 · กำไรสุทธิ = ยอดขาย − ยอดซื้อ − ค่าใช้จ่าย</p>
            </div></div>
            <div className="gg-card-body"><div className="chart-box"><TrendChart months={v.months} /></div></div>
          </section>
          <section className="gg-card">
            <div className="gg-card-head"><div>
              <h2 className="gg-card-title">หมวดหมู่สินค้าขายดี</h2>
              <p className="gg-card-sub">ยอดขายตามหมวดหมู่ · {PLABEL[period]}</p>
            </div></div>
            <div className="gg-card-body">
              <div className="pie-box">
                <CategoryChart items={v.cats} />
                <div className="pie-center"><div><strong>{v.cats.length ? v.cats[0].k : "ยังไม่มียอดขาย"}</strong><span>หมวดอันดับ 1</span></div></div>
              </div>
              <div className="legend-list">
                {v.cats.length ? v.cats.map((x, i) => (
                  <div className="li" key={x.k}>
                    <i style={{ background: `var(${COLOR_VARS[i % COLOR_VARS.length]})` }} />
                    <span>{x.k}</span><b>{D.baht(x.v)}</b><span className="p">{pct(x.v, v.catTotal)}</span>
                  </div>
                )) : <div className="gg-empty">ยังไม่มียอดขายในช่วงนี้</div>}
              </div>
            </div>
          </section>
        </div>

        {/* Agents + regions */}
        <div className="dash-row">
          <section className="gg-card flush">
            <div className="gg-card-head"><div>
              <h2 className="gg-card-title">ยอดขายและกำไรขั้นต้นตามพนักงานขาย</h2>
              <p className="gg-card-sub">อัตรากำไรขั้นต้น = (ราคาขาย − ราคาซื้อ) ÷ ราคาขาย · ราคาซื้อเฉลี่ยต่อหลาจากหน้ารายการซื้อ</p>
            </div></div>
            <div className="gg-card-body">
              <div className="gg-table-wrap"><table className="gg-table">
                <thead><tr><th>พนักงานขาย</th><th className="right">ยอดขายรวม</th><th className="right">กำไรขั้นต้น</th><th className="right">อัตรากำไรขั้นต้น</th></tr></thead>
                <tbody>
                  {v.agents.map((x) => (
                    <tr key={x.id}>
                      <td><div className="agent"><span className="gg-avatar">{x.ini}</span><div><div className="nm">{x.name}</div><div className="gg-hint">{x.role} · {x.n} บิล</div></div></div></td>
                      <td className="right" style={{ color: "var(--ink)", fontWeight: 600 }}>{D.baht(x.tot)}</td>
                      <td className={`right ${x.gp < 0 ? "neg" : "pos"}`}>{money(x.gp)}<div className="gg-hint">ขาย {D.baht(x.sell)}<br />ซื้อ {D.baht(x.cost)}</div></td>
                      <td><div className="margin"><span className="bar"><i style={{ width: Math.max(0, Math.min(100, x.m)).toFixed(0) + "%" }} /></span><span className="gg-num">{x.m.toFixed(1)}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td>รวม {v.agentTotal.n} บิล</td>
                  <td className="right gg-num">{D.baht(v.agentTotal.tot)}</td>
                  <td className={`right gg-num ${v.agentTotal.gp < 0 ? "neg" : "pos"}`}>{money(D.r2(v.agentTotal.gp))}</td>
                  <td className="right gg-num">{v.agentTotal.sell ? (((v.agentTotal.sell - v.agentTotal.cost) / v.agentTotal.sell) * 100).toFixed(1) : "0.0"}%</td>
                </tr></tfoot>
              </table></div>
              <div className="chart-box" style={{ height: 200, margin: "var(--space-4) var(--space-6) var(--space-6)" }}><AgentChart agents={v.agents} /></div>
            </div>
          </section>
          <section className="gg-card">
            <div className="gg-card-head">
              <div>
                <h2 className="gg-card-title">ภูมิภาคขายดี</h2>
                <p className="gg-card-sub">ยอดขายตามภูมิภาคของลูกค้า · {PLABEL[period]}</p>
              </div>
              <Link className="gg-btn gg-btn-ghost sm" href="/people/customers">ดูลูกค้า<ChevronRight className="gg-icon sm" aria-hidden /></Link>
            </div>
            <div className="gg-card-body"><div className="regions">
              {v.regions.length ? v.regions.map((x, i) => (
                <div className="reg" key={x.k}>
                  <span className={i === 0 ? "rk top" : "rk"}>{i + 1}</span>
                  <div>
                    <div className="nm">{x.k}</div>
                    <div className="sub">{x.c} ลูกค้า · {x.n} บิล</div>
                    <div className="bar"><i style={{ width: ((x.v / v.regMax) * 100).toFixed(1) + "%" }} /></div>
                  </div>
                  <div className="amt">{D.baht(x.v)}<span>{pct(x.v, v.regTotal)}</span></div>
                </div>
              )) : <div className="gg-empty">ยังไม่มียอดขายในช่วงนี้</div>}
            </div></div>
          </section>
        </div>

        {/* Recent sales */}
        <div className="gg-table-card">
          <div className="gg-table-toolbar">
            <div className="gg-row" style={{ flex: 1 }}><h2 className="gg-card-title">รายการขายล่าสุด</h2></div>
            <Link className="gg-btn gg-btn-ghost" href="/sales">ดูรายการขายทั้งหมด<ChevronRight className="gg-icon sm" aria-hidden /></Link>
          </div>
          <div className="gg-table-wrap">
            <table className="gg-table">
              <thead><tr><th>เลขที่อ้างอิง</th><th>ลูกค้า</th><th>ภูมิภาค</th><th>พนักงานขาย</th><th>สถานะ</th><th className="right">ยอดรวมสุทธิ</th><th className="right">ค้างชำระ</th><th>การชำระเงิน</th></tr></thead>
              <tbody>
                {RECENT.map((s) => {
                  const c = D.customer(s.customer), t = D.totals(s), paid = D.paidOf(s);
                  return (
                    <tr key={s.ref}>
                      <td><Link href={`/sales/${s.ref}`} style={{ textDecoration: "none" }}><span className="gg-badge neutral mono">{s.ref}</span></Link></td>
                      <td className="primary">{c.name}</td>
                      <td>{c.region || "—"}</td>
                      <td>{D.agent(s.agent).name}</td>
                      <td><Badge t={D.STATUS[s.status]} /></td>
                      <td className="right" style={{ color: "var(--ink)", fontWeight: 600 }}>{D.baht(t.grand)}</td>
                      <td className="right">{D.baht(t.grand - paid)}</td>
                      <td><Badge t={D.PAY[D.payState(t.grand, paid)]} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock alert */}
        <div className="gg-table-card">
          <div className="gg-table-toolbar">
            <div className="gg-row" style={{ flex: 1 }}>
              <h2 className="gg-card-title">แจ้งเตือนสต็อก</h2>
              <span>{ALERTS.length ? <Badge t={["danger", `${ALERTS.length} รายการถึงจุดแจ้งเตือน`]} /> : <Badge t={["success", "สต็อกปกติ"]} dot={false} />}</span>
            </div>
            <div className="gg-row"><Link className="gg-btn gg-btn-ghost" href="/products">ดูสินค้าทั้งหมด<ChevronRight className="gg-icon sm" aria-hidden /></Link></div>
          </div>
          <div className="gg-table-wrap">
            <table className="gg-table">
              <thead><tr><th>รหัส</th><th>สินค้า</th><th>คลังสินค้า</th><th className="right">คงเหลือ</th><th className="right">จุดแจ้งเตือน</th></tr></thead>
              <tbody>
                {ALERTS.length ? ALERTS.map((x) => (
                  <tr key={x.p.code + x.w.id}>
                    <td><span className="gg-badge neutral mono">{x.p.code}</span></td>
                    <td className="primary">{x.p.name}</td>
                    <td>{x.w.name}</td>
                    <td className="right">{x.q <= 0 ? <Badge t={["danger", "สินค้าหมด"]} /> : <Badge t={["warning", `${D.num(x.q)} หลา`]} />}</td>
                    <td className="right"><Badge t={["neutral", `${D.num(x.p.alert)} หลา`]} dot={false} /></td>
                  </tr>
                )) : <tr><td colSpan={5} className="gg-empty">ไม่มีสินค้าถึงจุดแจ้งเตือน</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
