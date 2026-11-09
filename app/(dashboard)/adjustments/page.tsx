import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Diff, Eye, Plus } from "lucide-react";

import ListPager from "@/components/list/ListPager";
import ListSearch from "@/components/list/ListSearch";
import { listAdjustments, type AdjustmentRow } from "@/lib/adjustments";
import { thaiDate, thaiTime } from "@/lib/format";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import "@/components/list/list.css";
import "./adjustments.css";

export const metadata: Metadata = { title: "ปรับปรุงสต็อก" };

const BASE_PATH = "/adjustments";
const SUB = "ปรับจำนวนผ้าคงเหลือให้ตรงกับของจริง เช่น หลังตรวจนับ พบผ้าชำรุด หรือตัดเศษปลายม้วน";
const num = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">ปรับปรุงสต็อก</h1>
        <p className="gg-pagehead-sub">{summary ?? SUB}</p>
      </div>
    </div>
  );
}

function Row({ a }: { a: AdjustmentRow }) {
  return (
    <tr>
      <td><span className="gg-badge neutral mono">{a.reference}</span></td>
      <td>{a.warehouseName}</td>
      <td className="created">{thaiDate(a.date)}</td>
      <td>{a.reason}</td>
      <td className="right">
        <span className="gg-num items-n">{a.itemCount} รายการ</span>
        {(a.added > 0 || a.removed > 0) && (
          <span className="deltas">
            {a.added > 0 && <span className="up">+{num(a.added)}</span>}
            {a.removed > 0 && <span className="down">−{num(a.removed)}</span>}
            <span className="u">หลา</span>
          </span>
        )}
      </td>
      <td className="created">
        {thaiDate(a.createdAt)}
        <span>{thaiTime(a.createdAt)}{a.createdByName ? ` · ${a.createdByName}` : ""}</span>
      </td>
      <td className="gg-actions-cell right">
        <div className="row-actions">
          <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${a.id}`} aria-label={`ดูรายละเอียด ${a.reference}`} title="ดูรายละเอียด">
            <Eye className="gg-icon sm" aria-hidden />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function CreateLink() {
  return (
    <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
      <Plus className="gg-icon" aria-hidden />
      สร้างรายการปรับปรุงสต็อก
    </Link>
  );
}

async function AdjustmentList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const { q, page, size } = parseListParams(await searchParams);
  const [list, canManage] = await Promise.all([listAdjustments({ q, page, size }), can("adjustments.manage")]);

  return (
    <>
      <PageHead summary={`${SUB} · ${list.totalActive.toLocaleString("th-TH")} เอกสาร`} />
      <div className="gg-table-card">
        <div className="gg-table-toolbar">
          <ListSearch basePath={BASE_PATH} q={q} size={size} placeholder="ค้นหาด้วยเลขที่เอกสาร คลัง เหตุผล หรือรหัสผ้า" label="ค้นหารายการปรับปรุงสต็อก" />
          {canManage && (
            <div className="gg-row">
              <CreateLink />
            </div>
          )}
        </div>

        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>เลขที่เอกสาร</th>
                <th>คลังสินค้า</th>
                <th>วันที่</th>
                <th>เหตุผล</th>
                <th className="right">รายการ</th>
                <th>บันทึกเมื่อ</th>
                <th className="gg-actions-cell right"><span className="gg-sr">การดำเนินการ</span></th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((a) => (
                <Row key={a.id} a={a} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="gg-empty">
                    {list.totalActive === 0 ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><Diff className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีรายการปรับปรุงสต็อก</b>
                        <span>บันทึกการปรับจำนวนผ้าหลังตรวจนับ ผ้าชำรุด หรือเศษปลายม้วน เพื่อให้สต็อกตรงกับของจริง</span>
                        {canManage && <CreateLink />}
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบเอกสารที่ตรงกับ &ldquo;{q}&rdquo;</b>
                        <span>ลองค้นหาด้วยเลขที่เอกสาร ชื่อคลัง เหตุผล หรือรหัสผ้าอื่น</span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ListPager basePath={BASE_PATH} q={q} size={size} page={list.page} pages={list.pages} total={list.total} />
      </div>
    </>
  );
}

/** Adjustments list, in the layout of the products list (design/src/pages/products.page.html). */
export default function AdjustmentsPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list lts-adjustments">
      <Suspense fallback={<PageHead />}>
        <AdjustmentList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
