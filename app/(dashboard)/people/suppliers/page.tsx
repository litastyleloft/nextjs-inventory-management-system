import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Factory, Pencil, Plus } from "lucide-react";

import ListPager from "@/components/list/ListPager";
import ListSearch from "@/components/list/ListSearch";
import { initials, thaiDate, thaiTime } from "@/lib/format";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import { listSuppliers, type SupplierRow } from "@/lib/suppliers";
import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import { deleteSupplier } from "./actions";
import ComingSoonButton from "@/components/list/ComingSoonButton";
import "@/components/list/list.css";

export const metadata: Metadata = { title: "ผู้จำหน่าย" };

const BASE_PATH = "/people/suppliers";

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">ผู้จำหน่าย</h1>
        <p className="gg-pagehead-sub">{summary ?? "โรงทอและผู้ค้าผ้าที่เราสั่งซื้อ"}</p>
      </div>
    </div>
  );
}

function Row({ s, canManage }: { s: SupplierRow; canManage: boolean }) {
  return (
    <tr>
      <td>
        <div className="who">
          <span className="gg-avatar sup" aria-hidden="true">{initials(s.name)}</span>
          <div>
            <span className="n">{s.name}</span>
            {s.email && <span className="sub">{s.email}</span>}
          </div>
        </div>
      </td>
      <td>{s.phoneNumber ?? <span className="sub">—</span>}</td>
      <td className="created">
        {thaiDate(s.createdAt)}
        <span>{thaiTime(s.createdAt)}</span>
      </td>
      {canManage && (
        <td className="gg-actions-cell right">
          <div className="row-actions">
            <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${s.id}/edit`} aria-label={`แก้ไข ${s.name}`} title="แก้ไข">
              <Pencil className="gg-icon sm" aria-hidden />
            </Link>
            <DeleteRecordButton id={s.id} name={s.name} noun="ผู้จำหน่าย" action={deleteSupplier} />
          </div>
        </td>
      )}
    </tr>
  );
}

async function SupplierList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const { q, page, size } = parseListParams(await searchParams);
  const [list, canManage] = await Promise.all([listSuppliers({ q, page, size }), can("suppliers.manage")]);

  return (
    <>
      <PageHead summary={`โรงทอและผู้ค้าผ้าที่เราสั่งซื้อ · ${list.totalActive} ราย`} />
      <div className="gg-table-card">
        <div className="gg-table-toolbar">
          <ListSearch basePath={BASE_PATH} q={q} size={size} placeholder="ค้นหาด้วยชื่อ อีเมล หรือเบอร์โทร" label="ค้นหาผู้จำหน่าย" />
          {canManage && (
            <div className="gg-row">
              <ComingSoonButton label="นำเข้าผู้จำหน่าย" message="การนำเข้าผู้จำหน่ายจากไฟล์ CSV จะเปิดให้ใช้เร็ว ๆ นี้" />
              <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                <Plus className="gg-icon" aria-hidden />
                เพิ่มผู้จำหน่าย
              </Link>
            </div>
          )}
        </div>

        <div className="gg-table-wrap pp-table">
          <table className="gg-table">
            <thead>
              <tr>
                <th>ผู้จำหน่าย</th>
                <th>เบอร์โทรศัพท์</th>
                <th>วันที่สร้าง</th>
                {canManage && <th className="gg-actions-cell right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((s) => (
                <Row key={s.id} s={s} canManage={canManage} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="gg-empty">
                    {list.totalActive === 0 ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><Factory className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีผู้จำหน่าย</b>
                        <span>เพิ่มโรงทอหรือผู้ค้าผ้ารายแรก เพื่อใช้ในใบสั่งซื้อและใบคืนสินค้า</span>
                        {canManage && (
                          <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                            <Plus className="gg-icon" aria-hidden />
                            เพิ่มผู้จำหน่าย
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบผู้จำหน่ายที่ตรงกับ &ldquo;{q}&rdquo;</b>
                        <span>ลองค้นหาด้วยชื่อ อีเมล เบอร์โทร หรือเมืองอื่น</span>
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

/** design/html/lts-suppliers.html (people-list template), with Edit/Delete buttons instead of the row menu. */
export default function SuppliersPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list">
      <Suspense fallback={<PageHead />}>
        <SupplierList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
