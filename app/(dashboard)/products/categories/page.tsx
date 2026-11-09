import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Folder } from "lucide-react";

import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import ListPager from "@/components/list/ListPager";
import ListSearch from "@/components/list/ListSearch";
import { listCategories, type CategoryRow } from "@/lib/categories";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import "@/components/list/list.css";
import { deleteCategory } from "./actions";
import { CategoryModalProvider, CreateCategoryButton, EditCategoryButton } from "./CategoryModal";
import "./categories.css";

export const metadata: Metadata = { title: "หมวดหมู่สินค้า" };

const BASE_PATH = "/products/categories";
const SUB = "กำหนดข้อมูลจำเพาะของผ้าครั้งเดียวต่อหมวดหมู่ แล้วใช้กับผ้าทุกรายการในหมวดหมู่นั้น";

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">หมวดหมู่สินค้า</h1>
        <p className="gg-pagehead-sub">{summary ?? SUB}</p>
      </div>
    </div>
  );
}

/** "Not set" marker from the design. */
const None = () => <span className="dash" title="ยังไม่ได้กำหนด">—</span>;

function Thumb({ c }: { c: CategoryRow }) {
  return (
    <span className="swatch">
      {c.image ? (
        <Image src={c.image} alt="" width={44} height={44} unoptimized />
      ) : (
        <Folder className="gg-icon sm" aria-hidden />
      )}
    </span>
  );
}

function Row({ c, canManage }: { c: CategoryRow; canManage: boolean }) {
  return (
    <tr>
      <td>
        <div className="cat-cell">
          <Thumb c={c} />
          <div>
            <div className="n">{c.name}</div>
            <div className="c"><span className="gg-badge neutral mono cat-code">{c.code}</span></div>
          </div>
        </div>
      </td>
      <td>{c.composition || <None />}</td>
      <td>{c.weave || <None />}</td>
      <td className="right">{c.widthInches ? `${c.widthInches}″` : <None />}</td>
      <td className="right">{c.gsm ? `${c.gsm} GSM` : <None />}</td>
      <td>{c.pattern || <None />}</td>
      <td className="right">
        {c.productCount ? (
          <Link className="count-link" href={`/products?category=${c.id}`}>{c.productCount.toLocaleString("th-TH")} รายการ</Link>
        ) : (
          <span className="count-zero">0 รายการ</span>
        )}
      </td>
      {canManage && (
        <td className="gg-actions-cell right">
          <div className="row-actions">
            <EditCategoryButton category={c} />
            <DeleteRecordButton
              id={c.id}
              name={c.name}
              noun="หมวดหมู่"
              action={deleteCategory}
              description={`ระบบจะลบหมวดหมู่ ${c.name} (${c.code}) และข้อมูลจำเพาะของผ้าที่กำหนดไว้ การลบนี้ไม่สามารถย้อนกลับได้`}
            />
          </div>
        </td>
      )}
    </tr>
  );
}

async function CategoryList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const { q, page, size } = parseListParams(await searchParams);
  const [list, canManage] = await Promise.all([listCategories({ q, page, size }), can("categories.manage")]);
  const columns = canManage ? 8 : 7;

  return (
    <CategoryModalProvider>
      <PageHead summary={`${SUB} · ${list.totalActive} หมวดหมู่`} />
      <div className="gg-table-card">
        <div className="gg-table-toolbar">
          <ListSearch
            basePath={BASE_PATH}
            q={q}
            size={size}
            placeholder="ค้นหาด้วยชื่อหมวดหมู่ รหัสย่อ หรือส่วนประกอบ"
            label="ค้นหาหมวดหมู่สินค้า"
          />
          {canManage && (
            <div className="gg-row">
              <CreateCategoryButton />
            </div>
          )}
        </div>

        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>หมวดหมู่สินค้า</th>
                <th>ส่วนประกอบ</th>
                <th>ลักษณะการทอ / ถัก</th>
                <th className="right">หน้ากว้าง</th>
                <th className="right">น้ำหนัก</th>
                <th>ลวดลาย</th>
                <th className="right">จำนวนสินค้า</th>
                {canManage && <th className="gg-actions-cell right"><span className="gg-sr">การดำเนินการ</span></th>}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((c) => (
                <Row key={c.id} c={c} canManage={canManage} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={columns} className="gg-empty">
                    {list.totalActive === 0 ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><Folder className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีหมวดหมู่สินค้า</b>
                        <span>เพิ่มหมวดหมู่แรก เช่น ฝ้าย หรือเดนิม เพื่อจัดกลุ่มผ้าและใช้เป็นรหัสนำหน้าสินค้า</span>
                        {canManage && <CreateCategoryButton />}
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบหมวดหมู่ที่ตรงกับ &ldquo;{q}&rdquo;</b>
                        <span>ลองค้นหาด้วยชื่อ รหัสย่อ หรือส่วนประกอบอื่น</span>
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
    </CategoryModalProvider>
  );
}

/** design/src/pages/categories.page.html, with Edit/Delete buttons instead of the row menu. */
export default function CategoriesPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list lts-cats">
      <Suspense fallback={<PageHead />}>
        <CategoryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
