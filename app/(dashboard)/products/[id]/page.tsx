import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, Pencil } from "lucide-react";

import DeleteRecordButton from "@/components/list/DeleteRecordButton";
import DetailList from "@/components/view/DetailList";
import ImageGallery from "@/components/view/ImageGallery";
import { thaiDate, thaiTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getProduct, productDeleteText, stockLevel, unitLabel } from "@/lib/products";
import { BARCODE_TYPES } from "@/lib/validation/product";
import "@/components/list/list.css";
import "@/components/view/view.css";
import { deleteProduct } from "../actions";

export const metadata: Metadata = { title: "รายละเอียดสินค้า" };

type Params = Promise<{ id: string }>;

const num = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
const when = (d: Date) => `${thaiDate(d)} ${thaiTime(d)}`;

function Head({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">{title}</h1>
        {sub && <p className="gg-pagehead-sub">{sub}</p>}
      </div>
      <div className="gg-pagehead-actions">
        {actions}
        <Link className="gg-btn gg-btn-secondary" href="/products">
          <ChevronLeft className="gg-icon" aria-hidden />
          ย้อนกลับ
        </Link>
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: ReturnType<typeof stockLevel> }) {
  if (level === "out-of-stock") return <span className="gg-badge danger"><span className="gg-badge-dot" />สินค้าหมด</span>;
  if (level === "low-stock") return <span className="gg-badge warning"><span className="gg-badge-dot" />ใกล้หมด</span>;
  return <span className="gg-badge success"><span className="gg-badge-dot" />มีสินค้า</span>;
}

async function ProductView({ params }: { params: Params }) {
  await connection();
  const { id } = await params;

  // getProduct skips deleted products, so a deleted one is "not found" here too.
  const product = await getProduct(id);
  if (!product) notFound();
  const canManage = await can("products.manage");

  const unit = unitLabel(product.unit);
  const total = product.stocks.reduce((sum, s) => sum + s.quantity.toNumber(), 0);
  const alert = product.stockAlert.toNumber();
  const level = stockLevel(total, alert);
  const c = product.category;

  return (
    <>
      <Head
        title={product.name}
        sub={`${product.code} · ${c.name}`}
        actions={
          canManage && (
            <>
              <DeleteRecordButton
                id={product.id}
                name={product.name}
                noun="สินค้า"
                action={deleteProduct}
                description={productDeleteText(product.code, total, product.unit)}
                redirectTo="/products"
                label="ลบสินค้า"
              />
              <Link className="gg-btn gg-btn-secondary" href={`/products/${product.id}/edit`}>
                <Pencil className="gg-icon" aria-hidden />
                แก้ไขสินค้า
              </Link>
            </>
          )
        }
      />
      <section className="gg-card">
        <div className="view-card">
          <div className="view-top">
            <ImageGallery images={product.images} alt={product.name} />
            <div className="view-panels">
              <DetailList
                title="ข้อมูลสินค้า"
                items={[
                  { label: "ชื่อสินค้า", value: <b>{product.name}</b> },
                  { label: "รหัสสินค้า", value: <span className="gg-badge neutral mono">{product.code}</span> },
                  { label: "หมวดหมู่", value: `${c.code} · ${c.name}${c.deletedAt ? " (ถูกลบแล้ว)" : ""}` },
                  { label: "ผู้จำหน่ายหลัก", value: product.supplier && `${product.supplier.name}${product.supplier.deletedAt ? " (ถูกลบแล้ว)" : ""}` },
                  { label: "ชื่อสี / เฉดสี", value: product.colorName },
                  { label: "ประเภทบาร์โค้ด", value: BARCODE_TYPES.find((b) => b.value === product.barcodeType)?.label ?? product.barcodeType },
                  { label: "หน่วยสินค้า", value: `${unit.name} (${product.unit})` },
                ]}
              />
              <DetailList
                title="ข้อมูลจำเพาะของผ้า (จากหมวดหมู่)"
                items={[
                  { label: "หน้ากว้าง", value: `${Number(product.code.slice(3, 5))}″ (จากรหัสสินค้า)` },
                  { label: "ส่วนประกอบ", value: c.composition },
                  { label: "ลักษณะการทอ / ถัก", value: c.weave },
                  { label: "ลวดลาย", value: c.pattern },
                  { label: "น้ำหนักผ้า", value: c.gsm ? `${c.gsm} GSM` : null },
                ]}
              />
              <DetailList
                title="สต็อกและบันทึก"
                items={[
                  { label: "จุดแจ้งเตือนสต็อก", value: `${num(alert)} ${unit.short}` },
                  { label: "วันที่สร้าง", value: when(product.createdAt) },
                  { label: "แก้ไขล่าสุด", value: when(product.updatedAt) },
                ]}
              />
              <section aria-label="หมายเหตุ">
                <h2 className="panel-h">หมายเหตุ</h2>
                {product.notes ? <p className="view-note">{product.notes}</p> : <p className="view-note"><span className="none" style={{ color: "var(--muted)" }}>—</span></p>}
              </section>
            </div>
          </div>

          <div className="view-section view-bottom">
            <div>
              <h2 className="side-h">สต็อกตามคลังสินค้า</h2>
              {product.stocks.length ? (
                <div className="lines-wrap">
                  <table className="gg-table">
                    <thead>
                      <tr>
                        <th>คลังสินค้า</th>
                        <th className="right">คงเหลือ</th>
                        <th>อัปเดตล่าสุด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.stocks.map((s) => (
                        <tr key={s.warehouse.id}>
                          <td>
                            {s.warehouse.name}
                            {s.warehouse.deletedAt && <span className="gg-badge neutral" style={{ marginLeft: 8 }}>คลังถูกลบแล้ว</span>}
                          </td>
                          <td className="right"><b className="gg-num">{num(s.quantity.toNumber())}</b> {unit.short}</td>
                          <td className="created">{thaiDate(s.updatedAt)}<span>{thaiTime(s.updatedAt)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-box">ยังไม่มีสต็อกในคลังใด · รับเข้าผ่านหน้าการซื้อ หรือปรับปรุงสต็อก</div>
              )}
            </div>
            <div className="totals" aria-label="สรุปสต็อก">
              <div className="tr"><span>จำนวนคลังที่มีสต็อก</span><span>{product.stocks.filter((s) => s.quantity.toNumber() > 0).length} คลัง</span></div>
              <div className="tr"><span>จุดแจ้งเตือน</span><span>{num(alert)} {unit.short}</span></div>
              <div className="tr"><span>สถานะ</span><LevelBadge level={level} /></div>
              <div className="tr grand"><span>คงเหลือรวม</span><span>{num(total)} {unit.short}</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Read-only product page: every product field, the images, the category's fabric specs
 * and the stock in each warehouse (from ProductStock). Built from the reusable view parts
 * in components/view (DetailList, ImageGallery, view.css).
 */
export default function ProductViewPage({ params }: { params: Params }) {
  return (
    <div className="lts-list lts-view">
      <Suspense fallback={<Head title="รายละเอียดสินค้า" />}>
        <ProductView params={params} />
      </Suspense>
    </div>
  );
}
