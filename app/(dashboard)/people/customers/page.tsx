import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Lock, Pencil, Plus, UsersRound } from "lucide-react";

import ComingSoonButton from "@/components/list/ComingSoonButton";
import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import { deleteCustomer } from "./actions";
import ListPager from "@/components/list/ListPager";
import ListSearch from "@/components/list/ListSearch";
import { DIRECT_CUSTOMER_KEY, listCustomers, type CustomerRow } from "@/lib/customers";
import { initials, thaiDate, thaiTime } from "@/lib/format";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import "@/components/list/list.css";

export const metadata: Metadata = { title: "ลูกค้า" };

const BASE_PATH = "/people/customers";

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">ลูกค้า</h1>
        <p className="gg-pagehead-sub">{summary ?? "ร้านค้าและโรงงานที่ซื้อผ้าจากเรา"}</p>
      </div>
    </div>
  );
}

function Row({ c, canManage }: { c: CustomerRow; canManage: boolean }) {
  const isDefault = c.systemKey === DIRECT_CUSTOMER_KEY;
  return (
    <tr>
      <td>
        <div className="who">
          {/* The design shows the walk-in (default) customer with the gold "alt" avatar. */}
          <span className={`gg-avatar${isDefault ? " alt" : ""}`} aria-hidden="true">{initials(c.name)}</span>
          <div>
            <span className="n">
              {c.name}
              {isDefault && <span className="gg-badge gold tag-default">ลูกค้าเริ่มต้น</span>}
            </span>
          </div>
        </div>
      </td>
      <td>{c.phoneNumber ?? <span className="sub">—</span>}</td>
      <td className="created">
        {thaiDate(c.createdAt)}
        <span>{thaiTime(c.createdAt)}</span>
      </td>
      {canManage && (
        <td className="gg-actions-cell right">
          <div className="row-actions">
            <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${c.id}/edit`} aria-label={`แก้ไข ${c.name}`} title="แก้ไข">
              <Pencil className="gg-icon sm" aria-hidden />
            </Link>
            {isDefault ? (
              // The default "direct customer" is what the POS sells to when no customer is
              // chosen, so it can never be deleted (deleteCustomer refuses too). Show a lock
              // with the reason instead of a delete button.
              <span className="gg-btn gg-btn-ghost sm icon-only row-locked" role="img" aria-label="ลูกค้าเริ่มต้นของ POS ลบไม่ได้" title="ลูกค้าเริ่มต้นของ POS ลบไม่ได้">
                <Lock className="gg-icon sm" aria-hidden />
              </span>
            ) : (
              <DeleteRecordButton id={c.id} name={c.name} noun="ลูกค้า" action={deleteCustomer} />
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

async function CustomerList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const { q, page, size } = parseListParams(await searchParams);
  const [list, canManage] = await Promise.all([listCustomers({ q, page, size }), can("customers.manage")]);

  return (
    <>
      <PageHead summary={`ร้านค้าและโรงงานที่ซื้อผ้าจากเรา · ${list.totalActive} ราย`} />
      <div className="gg-table-card">
        <div className="gg-table-toolbar">
          <ListSearch basePath={BASE_PATH} q={q} size={size} placeholder="ค้นหาด้วยชื่อ เบอร์โทร หรือจังหวัด" label="ค้นหาลูกค้า" />
          {canManage && (
            <div className="gg-row">
              <ComingSoonButton label="นำเข้าลูกค้า" message="การนำเข้าลูกค้าจากไฟล์ CSV จะเปิดให้ใช้เร็ว ๆ นี้" />
              <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                <Plus className="gg-icon" aria-hidden />
                เพิ่มลูกค้า
              </Link>
            </div>
          )}
        </div>

        <div className="gg-table-wrap pp-table">
          <table className="gg-table">
            <thead>
              <tr>
                <th>ลูกค้า</th>
                <th>เบอร์โทรศัพท์</th>
                <th>วันที่สร้าง</th>
                {canManage && <th className="gg-actions-cell right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((c) => (
                <Row key={c.id} c={c} canManage={canManage} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="gg-empty">
                    {list.totalActive === 0 ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><UsersRound className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีลูกค้า</b>
                        <span>เพิ่มร้านค้าหรือโรงงานรายแรก เพื่อใช้ในการขายและใบวางบิล</span>
                        {canManage && (
                          <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
                            <Plus className="gg-icon" aria-hidden />
                            เพิ่มลูกค้า
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบลูกค้าที่ตรงกับ &ldquo;{q}&rdquo;</b>
                        <span>ลองค้นหาด้วยชื่อ เบอร์โทร หรือจังหวัดอื่น</span>
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

/** design/html/lts-customers.html (people-list template), with Edit/Delete buttons instead of the row menu. */
export default function CustomersPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list">
      <Suspense fallback={<PageHead />}>
        <CustomerList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
