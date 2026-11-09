import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, Package } from "lucide-react";

import DetailList from "@/components/view/DetailList";
import { ADJUSTMENT_TYPES } from "@/lib/adjustment-options";
import { getAdjustment } from "@/lib/adjustments";
import { thaiDate, thaiTime } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import "@/components/list/list.css";
import "@/components/view/view.css";
import "../adjustments.css";

export const metadata: Metadata = { title: "รายละเอียดการปรับปรุงสต็อก" };

type Params = Promise<{ id: string }>;

const num = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

function Head({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">{title}</h1>
        {sub && <p className="gg-pagehead-sub">{sub}</p>}
      </div>
      <div className="gg-pagehead-actions">
        <Link className="gg-btn gg-btn-secondary" href="/adjustments">
          <ChevronLeft className="gg-icon" aria-hidden />
          ย้อนกลับ
        </Link>
      </div>
    </div>
  );
}

const deletedTag = (deleted: Date | null | undefined): ReactNode =>
  deleted ? <span className="gg-badge neutral" style={{ marginLeft: 8 }}>ถูกลบแล้ว</span> : null;

async function AdjustmentView({ params }: { params: Params }) {
  await connection();
  const { id } = await params;

  // getAdjustment skips deleted adjustments, so a deleted one is "not found" here too.
  const a = await getAdjustment(id);
  if (!a) notFound();

  const lines = a.items.map((i) => ({ ...i, qty: i.quantity.toNumber(), before: i.stockBefore.toNumber(), after: i.stockAfter.toNumber() }));
  const added = lines.filter((l) => l.type === "ADDITION").reduce((s, l) => s + l.qty, 0);
  const removed = lines.filter((l) => l.type === "SUBTRACTION").reduce((s, l) => s + l.qty, 0);
  const who = a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : null;

  return (
    <>
      <Head title={a.reference} sub={`ปรับปรุงสต็อก · ${a.warehouse.name} · ${thaiDate(a.date)}`} />
      <section className="gg-card">
        <div className="view-card">
          <div className="view-panels adj-panels">
            <DetailList
              title="ข้อมูลเอกสาร"
              items={[
                { label: "เลขที่เอกสาร", value: <span className="gg-badge neutral mono">{a.reference}</span> },
                { label: "คลังสินค้า", value: <>{a.warehouse.name}{deletedTag(a.warehouse.deletedAt)}</> },
                { label: "วันที่", value: thaiDate(a.date) },
                { label: "เหตุผล", value: a.reason },
              ]}
            />
            <DetailList
              title="บันทึก"
              items={[
                { label: "บันทึกโดย", value: who && <>{who}{deletedTag(a.createdBy?.deletedAt)}</> },
                { label: "บันทึกเมื่อ", value: `${thaiDate(a.createdAt)} ${thaiTime(a.createdAt)}` },
              ]}
            />
            <section aria-label="หมายเหตุ">
              <h2 className="panel-h">หมายเหตุ</h2>
              <p className="view-note">{a.notes || <span style={{ color: "var(--muted)" }}>—</span>}</p>
            </section>
          </div>

          <div className="view-section view-bottom">
            <div>
              <h2 className="side-h">รายการสินค้า</h2>
              <div className="lines-wrap">
                <table className="gg-table">
                  <thead>
                    <tr>
                      <th>สินค้า</th>
                      <th>ประเภท</th>
                      <th className="right">จำนวน</th>
                      <th className="right">คงเหลือก่อนปรับ</th>
                      <th className="right">คงเหลือหลังปรับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => {
                      const unit = unitLabel(l.product.unit).short;
                      const add = l.type === "ADDITION";
                      const cover = l.product.images[0]?.url;
                      return (
                        <tr key={l.id}>
                          <td className="pcol">
                            <div className="adj-pcell">
                              <span className="adj-thumb">
                                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded product photo */}
                                {cover ? <img src={cover} alt="" /> : <Package className="gg-icon sm" aria-hidden />}
                              </span>
                              <div>
                                {l.product.deletedAt ? (
                                  <span className="n">{l.product.name}</span>
                                ) : (
                                  <Link className="n" href={`/products/${l.product.id}`}>{l.product.name}</Link>
                                )}
                                <div>
                                  <span className="gg-badge neutral mono adj-code">{l.product.code}</span>
                                  {deletedTag(l.product.deletedAt)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`gg-badge ${add ? "success" : "danger"}`}>
                              {ADJUSTMENT_TYPES.find((t) => t.value === l.type)?.label}
                            </span>
                          </td>
                          <td className={`right adj-qty ${add ? "up" : "down"}`}>{add ? "+" : "−"}{num(l.qty)} {unit}</td>
                          <td className="right gg-num">{num(l.before)} {unit}</td>
                          <td className="right"><b className="gg-num">{num(l.after)}</b> {unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="totals" aria-label="สรุป">
              <div className="tr"><span>จำนวนรายการ</span><span>{lines.length} รายการ</span></div>
              <div className="tr"><span>เพิ่มรวม</span><span className="adj-qty up">+{num(added)} หลา</span></div>
              <div className="tr"><span>ลดรวม</span><span className="adj-qty down">−{num(removed)} หลา</span></div>
              <div className="tr grand"><span>สุทธิ</span><span>{added - removed >= 0 ? "+" : "−"}{num(Math.abs(added - removed))} หลา</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Read-only adjustment document: header, who/when, notes, and each line with the stock
 * before and after it was applied (recorded at save time, so this is the trail even after
 * later stock changes). Built from the reusable view parts in components/view.
 */
export default function AdjustmentViewPage({ params }: { params: Params }) {
  return (
    <div className="lts-list lts-view lts-adjustments">
      <Suspense fallback={<Head title="รายละเอียดการปรับปรุงสต็อก" />}>
        <AdjustmentView params={params} />
      </Suspense>
    </div>
  );
}
