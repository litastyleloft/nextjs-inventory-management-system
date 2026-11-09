import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Eye, Package, Pencil, Plus } from "lucide-react";

import ComingSoonButton from "@/components/list/ComingSoonButton";
import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import ListPager from "@/components/list/ListPager";
import { thaiDate, thaiTime } from "@/lib/format";
import { parseListParams, type ListSearchParams } from "@/lib/list";
import { can } from "@/lib/permissions";
import { categoryOptions, listProducts, parseProductFilters, productDeleteText, unitLabel, type ProductRow } from "@/lib/products";
import "@/components/list/list.css";
import { deleteProduct } from "./actions";
import ProductToolbar from "./ProductToolbar";
import "./products.css";

export const metadata: Metadata = { title: "สินค้า" };

const BASE_PATH = "/products";
const SUB = "ผ้าทุกรายการซื้อ ขาย และนับสต็อกเป็นหลา ในทุกคลังสินค้า";
const num = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

function PageHead({ summary }: { summary?: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">สินค้า</h1>
        <p className="gg-pagehead-sub">{summary ?? SUB}</p>
      </div>
    </div>
  );
}

function StockCell({ p }: { p: ProductRow }) {
  const unit = unitLabel(p.unit).short;
  if (p.level === "out-of-stock") return <span className="gg-badge danger"><span className="gg-badge-dot" />สินค้าหมด</span>;
  if (p.level === "low-stock")
    return (
      <span className="gg-badge warning" title={`ถึงจุดแจ้งเตือน ${num(p.stockAlert)} ${unit}`}>
        <span className="gg-badge-dot" />
        {num(p.stock)} {unit} · ใกล้หมด
      </span>
    );
  return (
    <>
      <span className="stock-ok gg-num">{num(p.stock)}</span>
      <span className="unit-sfx">{unit}</span>
    </>
  );
}

function Row({ p, canManage }: { p: ProductRow; canManage: boolean }) {
  const spec = [p.composition, `หน้ากว้าง ${p.widthInches}″`].filter(Boolean).join(" · ");
  return (
    <tr>
      <td>
        <span className="thumb">
          {p.coverUrl ? <Image src={p.coverUrl} alt="" width={44} height={44} unoptimized /> : <Package className="gg-icon sm" aria-hidden />}
        </span>
      </td>
      <td className="name-cell">
        <div className="n">{p.name}</div>
        <div className="c">{spec}</div>
      </td>
      <td><span className="gg-badge neutral mono">{p.code}</span></td>
      <td>{p.categoryName}</td>
      <td className="right">
        {/* Latest sale price: comes from Sales once that module exists. */}
        <span className="price-none" title="ยังไม่มีการขาย">—</span>
        <div className="gg-hint">ต่อ{unitLabel(p.unit).name}</div>
      </td>
      <td className="right"><StockCell p={p} /></td>
      <td className="created">
        {thaiDate(p.createdAt)}
        <span>{thaiTime(p.createdAt)}</span>
      </td>
      <td className="gg-actions-cell right">
        <div className="row-actions">
          <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${p.id}`} aria-label={`ดูรายละเอียด ${p.name}`} title="ดูรายละเอียด">
            <Eye className="gg-icon sm" aria-hidden />
          </Link>
          {canManage && (
            <>
              <Link className="gg-btn gg-btn-ghost sm icon-only" href={`${BASE_PATH}/${p.id}/edit`} aria-label={`แก้ไข ${p.name}`} title="แก้ไข">
                <Pencil className="gg-icon sm" aria-hidden />
              </Link>
              <DeleteRecordButton id={p.id} name={p.name} noun="สินค้า" action={deleteProduct} description={productDeleteText(p.code, p.stock, p.unit)} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function CreateLink() {
  return (
    <Link className="gg-btn gg-btn-primary" href={`${BASE_PATH}/create`}>
      <Plus className="gg-icon" aria-hidden />
      เพิ่มสินค้า
    </Link>
  );
}

async function ProductList({ searchParams }: { searchParams: ListSearchParams }) {
  await connection();
  const raw = await searchParams;
  const { q, page, size } = parseListParams(raw);
  const filters = parseProductFilters(raw);
  const [list, categories, canManage] = await Promise.all([listProducts({ q, page, size }, filters), categoryOptions(), can("products.manage")]);
  const filtered = Boolean(q || filters.category || filters.stock);

  return (
    <>
      <PageHead summary={`ผ้า ${list.totalActive.toLocaleString("th-TH")} รายการ ใน ${list.categoriesInUse} หมวดหมู่ · ซื้อ ขาย และนับสต็อกเป็นหลา`} />
      <div className="gg-table-card">
        <ProductToolbar
          basePath={BASE_PATH}
          q={q}
          size={size}
          filters={filters}
          categories={categories}
          actions={
            <>
              <ComingSoonButton icon="download" label="ส่งออกสินค้า" message="การส่งออกสินค้าเป็นไฟล์ CSV จะเปิดให้ใช้เร็ว ๆ นี้" />
              {canManage && (
                <>
                  <ComingSoonButton icon="upload" label="นำเข้าสินค้า" message="การนำเข้าสินค้าจากไฟล์ CSV จะเปิดให้ใช้เร็ว ๆ นี้" />
                  <CreateLink />
                </>
              )}
            </>
          }
        />

        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th style={{ width: 76 }}>สินค้า</th>
                <th>ชื่อสินค้า</th>
                <th>รหัส</th>
                <th>หมวดหมู่</th>
                <th className="right">ราคาขายล่าสุด</th>
                <th className="right">คงเหลือ</th>
                <th>วันที่สร้าง</th>
                <th className="gg-actions-cell right"><span className="gg-sr">การดำเนินการ</span></th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((p) => (
                <Row key={p.id} p={p} canManage={canManage} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="gg-empty">
                    {!filtered ? (
                      <div className="list-empty">
                        <span className="list-empty-icon"><Package className="gg-icon" aria-hidden /></span>
                        <b>ยังไม่มีสินค้า</b>
                        <span>เพิ่มผ้ารายการแรก พร้อมรหัสสินค้าและสต็อกเริ่มต้น</span>
                        {canManage && <CreateLink />}
                      </div>
                    ) : (
                      <div className="list-empty">
                        <b>ไม่พบผ้าที่ตรงกับ{q ? <> &ldquo;{q}&rdquo;</> : "ตัวกรอง"}</b>
                        <span>ลองค้นหาด้วยชื่อ รหัส หรือส่วนประกอบอื่น หรือ <Link href={BASE_PATH}>ล้างตัวกรอง</Link></span>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ListPager basePath={BASE_PATH} q={q} size={size} page={list.page} pages={list.pages} total={list.total} filters={filters} />
      </div>
    </>
  );
}

/** design/src/pages/products.page.html, with View/Edit/Delete buttons instead of the row menu. */
export default function ProductsPage({ searchParams }: { searchParams: ListSearchParams }) {
  return (
    <div className="lts-list lts-products">
      <Suspense fallback={<PageHead />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
