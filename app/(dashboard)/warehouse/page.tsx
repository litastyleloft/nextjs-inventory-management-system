import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Pencil, Plus, Warehouse } from "lucide-react";

import ListPager from "@/components/list/ListPager";
import ListSearch from "@/components/list/ListSearch";
import { thaiDate, thaiTime } from "@/lib/format";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import { listWarehouses, type WarehouseRow } from "@/lib/warehouses";
import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import { deleteWarehouse } from "./actions";
import "@/components/list/list.css";

export const metadata: Metadata = { title: "คลังสินค้า" };

const BASE_PATH = "/warehouse";

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">คลังสินค้า</h1>
        <p className="gg-pagehead-sub">{summary ?? "คลังและหน้าร้านที่เก็บผ้า"}</p>
      </div>
    </div>
  );
}

/** A value with a smaller line under it. Optional fields may be blank; "—" when both are. */
function TwoLine({ top, bottom }: { top: string | null; bottom: string | null }) {
  const main = top ?? bottom;
  if (!main) return <span className="sub">—</span>;
  return (
    <>
      {main}
      {top && bottom && <span className="sub">{bottom}</span>}
    </>
  );
}

function Row({ w, canManage }: { w: WarehouseRow; canManage: boolean }) {
  return (
    <tr>
      <td>
        <div className="who">
          <span className="gg-avatar sup"><Warehouse className="gg-icon sm" aria-hidden /></span>
          <span className="n">{w.name}</span>
        </div>
      </td>
      <td>
        <TwoLine top={w.email} bottom={w.phoneNumber} />
      </td>
      <td>
        <TwoLine top={w.city} bottom={w.country} />
      </td>
      <td className="created">
        {thaiDate(w.createdAt)}
        <span>{thaiTime(w.createdAt)}</span>
      </td>
      {canManage && (
        <td className="gg-actions-cell right">
          <div className="row-actions">
            <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${w.id}/edit`} aria-label={`แก้ไข ${w.name}`} title="แก้ไข">
              <Pencil className="gg-icon sm" aria-hidden />
            </Link>
            <DeleteRecordButton id={w.id} name={w.name} noun="คลังสินค้า" action={deleteWarehouse} />
          </div>
        </td>
      )}
    </tr>
  );
}

async function WarehouseList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const { q, page, size } = parseListParams(await searchParams);
  const [list, canManage] = await Promise.all([listWarehouses({ q, page, size }), can("warehouses.manage")]);

  return (
    <>
      <PageHead summary={`คลังและหน้าร้านที่เก็บผ้า · ${list.totalActive} แห่ง`} />
      <div className="gg-table-card">
        <div className="gg-table-toolbar">
          <ListSearch basePath={BASE_PATH} q={q} size={size} placeholder="ค้นหาด้วยชื่อ อีเมล เมือง หรือรหัสไปรษณีย์" label="ค้นหาคลังสินค้า" />
          {canManage && (
            <div className="gg-row">
              <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                <Plus className="gg-icon" aria-hidden />
                เพิ่มคลังสินค้า
              </Link>
            </div>
          )}
        </div>

        <div className="gg-table-wrap pp-table">
          <table className="gg-table">
            <thead>
              <tr>
                <th>คลังสินค้า</th>
                <th>อีเมล / เบอร์โทรศัพท์</th>
                <th>เมือง / ประเทศ</th>
                <th>วันที่สร้าง</th>
                {canManage && <th className="gg-actions-cell right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((w) => (
                <Row key={w.id} w={w} canManage={canManage} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="gg-empty">
                    {list.totalActive === 0 ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><Warehouse className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีคลังสินค้า</b>
                        <span>เพิ่มคลังหรือหน้าร้านแห่งแรก เพื่อเริ่มบันทึกสต็อก การซื้อ และการขาย</span>
                        {canManage && (
                          <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                            <Plus className="gg-icon" aria-hidden />
                            เพิ่มคลังสินค้า
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบคลังสินค้าที่ตรงกับ &ldquo;{q}&rdquo;</b>
                        <span>ลองค้นหาด้วยชื่อ อีเมล เมือง หรือรหัสไปรษณีย์อื่น</span>
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

/** design/html/lts-warehouses.html (people-list template), with Edit/Delete buttons instead of the row menu. */
export default function WarehousesPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list">
      <Suspense fallback={<PageHead />}>
        <WarehouseList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
