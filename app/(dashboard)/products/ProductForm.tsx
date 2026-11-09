"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, ChevronDown, Folder, ShoppingCart } from "lucide-react";

import {
  EMPTY_SEGMENTS,
  PRODUCT_CODE_LENGTH,
  SEGMENTS,
  buildCode,
  cleanSegment,
  codeProblem,
  splitCode,
  type CodeSegments,
} from "@/lib/product-code";
import { BARCODE_TYPES, createProductErrors, productErrors, type ProductErrors, type ProductField } from "@/lib/validation/product";
import ImageListPicker, { type PickedImage, type SavedImage } from "@/components/form/ImageListPicker";
import { MAX_PRODUCT_IMAGES } from "@/lib/upload-limits";
import type { ProductActionResult } from "./actions";

export type CategoryOption = { id: string; code: string; name: string; widthInches: number | null };
export type WarehouseOption = { id: string; name: string };
export type SupplierOption = { id: string; name: string };

/** Form state: the code is kept as its four editable segments; the category gives AAA. */
type Values = {
  name: string;
  categoryId: string;
  supplierId: string;
  colorName: string;
  barcodeType: string;
  segments: CodeSegments;
  stockAlert: string;
  notes: string;
  warehouseId: string;
  initialQuantity: string;
};

const EMPTY: Values = {
  name: "",
  categoryId: "",
  supplierId: "",
  colorName: "",
  barcodeType: "CODE128",
  segments: EMPTY_SEGMENTS,
  stockAlert: "0",
  notes: "",
  warehouseId: "",
  initialQuantity: "",
};

/** A saved product as the edit form needs it. */
export type ProductFormInitial = {
  name: string;
  categoryId: string;
  /** Null for products saved before the supplier field existed: the form then asks for one. */
  supplierId: string | null;
  code: string;
  colorName: string | null;
  barcodeType: string;
  stockAlert: string;
  notes: string | null;
  images: SavedImage[];
  /** Current stock per warehouse (read-only on edit). */
  stock: { warehouse: string; quantity: number }[];
};

type Props = {
  /** One form, two modes: "create" starts blank; "edit" starts from the saved product. */
  mode: "create" | "edit";
  initial?: ProductFormInitial;
  categories: CategoryOption[];
  warehouses: WarehouseOption[];
  /** Active suppliers, for the main supplier dropdown. */
  suppliers: SupplierOption[];
  /** createProduct, or updateProduct bound to the product id. */
  action: (formData: FormData) => Promise<ProductActionResult>;
};

function toValues(p: ProductFormInitial): Values {
  return {
    ...EMPTY,
    name: p.name,
    categoryId: p.categoryId,
    supplierId: p.supplierId ?? "",
    colorName: p.colorName ?? "",
    barcodeType: p.barcodeType,
    segments: splitCode(p.code)?.segments ?? EMPTY_SEGMENTS,
    stockAlert: p.stockAlert,
    notes: p.notes ?? "",
  };
}

const qty = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

const SEGMENT_FIELDS: { key: keyof CodeSegments; id: string; label: string; placeholder: string; next?: keyof CodeSegments }[] = [
  { key: "width", id: "cWidth", label: "00 · หน้ากว้าง (นิ้ว)", placeholder: "58", next: "lot" },
  { key: "lot", id: "cLot", label: "B · ล็อต", placeholder: "A", next: "pattern" },
  { key: "pattern", id: "cDesign", label: "111 · ลายผ้า", placeholder: "101", next: "colour" },
  { key: "colour", id: "cColour", label: "222 · สีผ้า", placeholder: "001" },
];
const SEGMENT_ID = Object.fromEntries(SEGMENT_FIELDS.map((f) => [f.key, f.id])) as Record<keyof CodeSegments, string>;

/**
 * design/src/pages/create-product.page.html: product details on the left; images and the
 * optional initial stock on the right. Category and warehouse options come from the
 * database (passed in by the page), not from the design's sample lists.
 */
export default function ProductForm({ mode, initial, categories, warehouses, suppliers, action }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const editing = mode === "edit";
  const [values, setValues] = useState<Values>(initial ? toValues(initial) : EMPTY);
  // Edit: the saved images still kept, in order. Removing one here deletes it on save.
  const [saved, setSaved] = useState<SavedImage[]>(initial?.images ?? []);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<PickedImage[]>([]);

  const category = categories.find((c) => c.id === values.categoryId);
  const categoryCode = category?.code ?? "";
  const code = buildCode(categoryCode, values.segments);
  const problem = codeProblem(categoryCode, values.segments);
  const badCount = Object.values(errors).filter(Boolean).length;

  function set<K extends keyof Values>(key: K, value: Values[K], errorKey: ProductField = key as ProductField) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[errorKey] ? { ...e, [errorKey]: undefined } : e));
  }

  function setSegments(segments: CodeSegments) {
    set("segments", segments, "code");
  }

  function chooseCategory(id: string) {
    const c = categories.find((x) => x.id === id);
    // Like the design: the category's usual width fills the width segment if it is empty.
    const width = values.segments.width || (c?.widthInches && Number.isInteger(c.widthInches) && c.widthInches < 100 ? String(c.widthInches).padStart(2, "0") : "");
    setValues((v) => ({ ...v, categoryId: id, segments: { ...v.segments, width } }));
    setErrors((e) => ({ ...e, categoryId: undefined, code: undefined }));
  }

  function typeSegment(key: keyof CodeSegments, raw: string) {
    const value = cleanSegment(key, raw);
    setSegments({ ...values.segments, [key]: value });
    const next = SEGMENT_FIELDS.find((f) => f.key === key)?.next;
    if (value.length === SEGMENTS[key].length && next) formRef.current?.querySelector<HTMLInputElement>(`#${SEGMENT_ID[next]}`)?.focus();
  }

  function padSegment(key: keyof CodeSegments) {
    // Numbers are padded on leaving the field: 7 → 007.
    const v = values.segments[key];
    if (key !== "lot" && v && v.length < SEGMENTS[key].length) setSegments({ ...values.segments, [key]: v.padStart(SEGMENTS[key].length, "0") });
  }

  function pasteCode(raw: string) {
    const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, PRODUCT_CODE_LENGTH);
    setPaste(v);
    if (v.length !== PRODUCT_CODE_LENGTH) return setPasteError(v ? `รหัสต้องมี 12 ตัว (มี ${v.length})` : "");
    const parts = splitCode(v);
    if (!parts) return setPasteError("ไม่ตรงรูปแบบ AAA00B111222");
    const c = categories.find((x) => x.code === parts.category);
    if (!c) return setPasteError(`ไม่มีหมวดหมู่รหัส ${parts.category} เพิ่มหมวดหมู่ก่อนที่หน้าหมวดหมู่สินค้า`);
    setPasteError("");
    setValues((v) => ({ ...v, categoryId: c.id, segments: parts.segments }));
    setErrors((e) => ({ ...e, categoryId: undefined, code: undefined }));
  }

  function clientErrors(): ProductErrors {
    const fields = {
      name: values.name,
      categoryId: values.categoryId,
      supplierId: values.supplierId,
      code,
      colorName: values.colorName,
      barcodeType: values.barcodeType,
      stockAlert: values.stockAlert,
      notes: values.notes,
    };
    const found = editing
      ? productErrors(fields)
      : createProductErrors({ ...fields, warehouseId: values.warehouseId, initialQuantity: values.initialQuantity });
    // The design's step-by-step code messages are clearer than "wrong format".
    if (found.code || problem) found.code = problem || found.code;
    if (!values.categoryId) found.code = undefined; // the category error already says it
    return Object.fromEntries(Object.entries(found).filter(([, v]) => v)) as ProductErrors;
  }

  function focusFirst(found: ProductErrors) {
    const order: [ProductField, string][] = [
      ["name", "name"],
      ["categoryId", "category"],
      ["code", SEGMENT_ID[(Object.keys(SEGMENTS) as (keyof CodeSegments)[]).find((k) => values.segments[k].length !== SEGMENTS[k].length) ?? "width"]],
      ["colorName", "color"],
      ["stockAlert", "alert"],
      ["notes", "notes"],
      ["supplierId", "supplier"],
      ["warehouseId", "warehouse"],
      ["initialQuantity", "qty"],
    ];
    const first = order.find(([field]) => found[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#${first[1]}`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = clientErrors();
    setErrors(found);
    if (Object.keys(found).length) return focusFirst(found);

    setSaving(true);
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("categoryId", values.categoryId);
    formData.set("supplierId", values.supplierId);
    formData.set("code", code);
    formData.set("colorName", values.colorName);
    formData.set("barcodeType", values.barcodeType);
    formData.set("stockAlert", values.stockAlert);
    formData.set("notes", values.notes);
    if (editing) {
      // No stock fields on edit: see the note on the stock panel below.
      for (const image of saved) formData.append("keepImages", image.id);
    } else {
      formData.set("warehouseId", values.warehouseId);
      formData.set("initialQuantity", values.initialQuantity);
    }
    // In display order (kept images first); the first is the cover.
    for (const image of picked) formData.append("images", image.file);

    try {
      const result = await action(formData);
      if (result.status === "success") {
        toast.success(`บันทึก ${result.code} แล้ว`, { id: "product-form" });
        // Reset first: with cacheComponents this page stays mounted (hidden) after leaving.
        // (Edit: the page remounts the form from the saved product when it changes.)
        if (!editing) {
          setValues(EMPTY);
          setPaste("");
          setPicked([]);
        }
        router.push("/products");
        return;
      }
      if (result.status === "invalid") {
        setErrors(result.errors);
        focusFirst(result.errors);
        toast.error("กรุณาตรวจสอบข้อมูลที่กรอก", { id: "product-form" });
      } else if (result.status === "busy") {
        toast.error("มีการบันทึกข้อมูลพร้อมกัน กรุณากดบันทึกอีกครั้ง", { id: "product-form" });
      } else if (result.status === "forbidden") {
        toast.error("คุณไม่มีสิทธิ์จัดการสินค้า", { id: "product-form" });
      } else if (result.status === "not-found") {
        toast.error("ไม่พบสินค้านี้ อาจถูกลบไปแล้ว", { id: "product-form" });
        router.push("/products");
        return;
      } else {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: "product-form" });
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: "product-form" });
    }
    setSaving(false);
  }

  const invalid = (field: ProductField) => (errors[field] ? " invalid" : "");
  const describe = (field: ProductField, hintId?: string) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : hintId,
  });
  const errorOr = (field: ProductField, hint?: ReactNode, hintId?: string) =>
    errors[field] ? <div className="gg-error" id={`${field}-error`}>{errors[field]}</div> : hint ? <div className="gg-hint" id={hintId}>{hint}</div> : null;

  const segmentsShown: [string, string, string][] = [
    [categoryCode, "AAA", "หมวดหมู่"],
    [values.segments.width, "00", "หน้ากว้าง"],
    [values.segments.lot, "B", "ล็อต"],
    [values.segments.pattern, "111", "ลายผ้า"],
    [values.segments.colour, "222", "สีผ้า"],
  ];
  const codeState = problem
    ? code.length === PRODUCT_CODE_LENGTH
      ? { tone: "danger", text: "ใช้ไม่ได้" }
      : { tone: "neutral", text: `ยังไม่ครบ ${code.length}/12` }
    : errors.code
      ? { tone: "danger", text: "ใช้ไม่ได้" }
      : { tone: "success", text: "พร้อมใช้" };

  return (
    <form ref={formRef} className="gg-card" id="productForm" noValidate autoComplete="off" onSubmit={handleSubmit} aria-busy={saving}>
      <div className="create-grid">
        <div className="create-main">
          <div className="gg-form-grid">
            <div className="gg-form-section">ข้อมูลพื้นฐาน</div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="name">ชื่อสินค้า<span className="gg-req" aria-hidden="true">*</span></label>
              <div className={`gg-control${invalid("name")}`}>
                <input id="name" required maxLength={200} placeholder="กรอกชื่อผ้า" value={values.name} onChange={(e) => set("name", e.target.value)} {...describe("name")} />
              </div>
              {errorOr("name")}
            </div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="category">หมวดหมู่สินค้า<span className="gg-req" aria-hidden="true">*</span></label>
              <div className={`gg-control${invalid("categoryId")}`}>
                <select id="category" required value={values.categoryId} className={values.categoryId ? undefined : "is-placeholder"} onChange={(e) => chooseCategory(e.target.value)} {...describe("categoryId", "categoryHint")}>
                  <option value="" disabled>เลือกหมวดหมู่สินค้า</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                  ))}
                </select>
                <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
              </div>
              {errorOr(
                "categoryId",
                categories.length ? "รหัสหมวดหมู่ 3 ตัวอักษรจะเป็นส่วนแรกของรหัสสินค้า" : <>ยังไม่มีหมวดหมู่ · <Link href="/products/categories">เพิ่มหมวดหมู่สินค้า</Link></>,
                "categoryHint",
              )}
            </div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="color">ชื่อสี / เฉดสี<span className="optional">(ไม่บังคับ)</span></label>
              <div className={`gg-control${invalid("colorName")}`}>
                <input id="color" maxLength={100} placeholder="เช่น สีคราม, สีขาวออปติก" value={values.colorName} onChange={(e) => set("colorName", e.target.value)} {...describe("colorName")} />
              </div>
              {errorOr("colorName")}
            </div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="symbology">ประเภทบาร์โค้ด<span className="gg-req" aria-hidden="true">*</span></label>
              <div className={`gg-control${invalid("barcodeType")}`}>
                <select id="symbology" required value={values.barcodeType} onChange={(e) => set("barcodeType", e.target.value)} {...describe("barcodeType")}>
                  {BARCODE_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
                <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
              </div>
              {errorOr("barcodeType")}
            </div>

            <div className="gg-form-section">รหัสสินค้า</div>
            <div className="gg-field span-2">
              <span className="gg-label" id="codeLabel">รูปแบบ AAA 00 B 111 222<span className="gg-req" aria-hidden="true">*</span></span>
              <div className="code-builder" role="group" aria-labelledby="codeLabel" aria-describedby={errors.code ? "code-error" : "codeHelp"}>
                <div className="gg-field">
                  <label className="gg-label" htmlFor="cCat">AAA · หมวดหมู่</label>
                  <div className="gg-control disabled"><input id="cCat" readOnly tabIndex={-1} placeholder="AAA" value={categoryCode} /></div>
                </div>
                {SEGMENT_FIELDS.map((f) => (
                  <div className="gg-field" key={f.key}>
                    <label className="gg-label" htmlFor={f.id}>{f.label}</label>
                    <div className={`gg-control${errors.code && values.segments[f.key].length !== SEGMENTS[f.key].length ? " invalid" : ""}`}>
                      <input
                        id={f.id}
                        maxLength={SEGMENTS[f.key].length}
                        inputMode={f.key === "lot" ? undefined : "numeric"}
                        placeholder={f.placeholder}
                        value={values.segments[f.key]}
                        onChange={(e) => typeSegment(f.key, e.target.value)}
                        onBlur={() => padSegment(f.key)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {errors.code ? (
                <div className="gg-error" id="code-error">{errors.code}</div>
              ) : (
                <div className="gg-hint" id="codeHelp">หมวดหมู่ 3 ตัวอักษร · หน้ากว้าง 2 หลัก · ล็อต 1 ตัวอักษร · ลายผ้า 3 หลัก · สีผ้า 3 หลัก</div>
              )}
              <div className="code-preview" aria-live="polite">
                {segmentsShown.map(([value, placeholder, label]) => (
                  <div className="seg" key={label}>
                    <b className={value ? undefined : "empty"}>{value || placeholder}</b>
                    <span>{label}</span>
                  </div>
                ))}
                <div className="full">
                  <code id="code">{code || "—"}</code>
                  <span className={`gg-badge ${codeState.tone}`}>{codeState.text}</span>
                </div>
              </div>
              <div className="gg-field paste-field">
                <label className="gg-label" htmlFor="paste">วางรหัสเต็ม<span className="optional">(ไม่บังคับ)</span></label>
                <div className={`gg-control${pasteError ? " invalid" : ""}`} style={{ maxWidth: 320 }}>
                  <input id="paste" maxLength={20} placeholder="เช่น COT58A101001" value={paste} onChange={(e) => pasteCode(e.target.value)} aria-invalid={pasteError ? true : undefined} aria-describedby={pasteError ? "paste-error" : "pasteHint"} />
                </div>
                {pasteError ? <div className="gg-error" id="paste-error">{pasteError}</div> : <div className="gg-hint" id="pasteHint">วางรหัส 12 ตัว ระบบจะแยกใส่ช่องด้านบนให้</div>}
              </div>
            </div>

            <div className="gg-form-section">หน่วยและสต็อก</div>
            <div className="gg-field">
              <span className="gg-label">หน่วยสินค้า</span>
              <div className="unit-fixed">หลา (yard)<span className="gg-badge info">ซื้อ ขาย และนับสต็อกเป็นหลา</span></div>
            </div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="alert">จุดแจ้งเตือนสต็อก</label>
              <div className={`gg-control${invalid("stockAlert")}`}>
                <input id="alert" inputMode="decimal" value={values.stockAlert} onChange={(e) => set("stockAlert", e.target.value)} {...describe("stockAlert", "alertHint")} />
                <span className="gg-addon">หลา</span>
              </div>
              {errorOr("stockAlert", "แจ้งว่าใกล้หมดเมื่อคงเหลือเท่ากับหรือต่ำกว่าจำนวนนี้", "alertHint")}
            </div>
            <div className="gg-field span-2">
              <div className="spec-note price-note">
                <ShoppingCart className="gg-icon sm" aria-hidden />
                <span>ราคาซื้อกำหนดตอนสร้างรายการซื้อ และราคาขายกำหนดตอนขาย จึงไม่ต้องกรอกที่นี่ · <Link href="/purchases/create">ไปหน้าสร้างรายการซื้อ</Link></span>
              </div>
            </div>
            <div className="gg-field span-2">
              <span className="gg-label">ข้อมูลจำเพาะของผ้า</span>
              <div className="spec-note">
                <Folder className="gg-icon sm" aria-hidden />
                <span>ส่วนประกอบ น้ำหนัก ลักษณะการทอ และลวดลาย กำหนดที่หน้าหมวดหมู่สินค้า และใช้กับผ้าทุกรายการในหมวดหมู่นั้น</span>
              </div>
            </div>
            <div className="gg-field span-2">
              <label className="gg-label" htmlFor="notes">หมายเหตุ<span className="optional">(ไม่บังคับ)</span></label>
              <div className={`gg-control textarea${invalid("notes")}`}>
                <textarea id="notes" rows={3} maxLength={1000} placeholder="เช่น การตกแต่งผ้า การหดตัว วิธีดูแลรักษา" value={values.notes} onChange={(e) => set("notes", e.target.value)} {...describe("notes")} />
              </div>
              {errorOr("notes")}
            </div>
          </div>
        </div>

        <aside className="create-side" aria-label={editing ? "รูปภาพและสต็อกคงเหลือ" : "รูปภาพและสต็อกเริ่มต้น"}>
          <div className="gg-form-section">รูปภาพ</div>
          <ImageListPicker
            label="รูปภาพสินค้า"
            hint={`ใช้รูปผ้าระยะใกล้เป็นรูปแรก ไฟล์ JPG หรือ PNG สูงสุด ${MAX_PRODUCT_IMAGES} รูป`}
            max={MAX_PRODUCT_IMAGES}
            saved={saved}
            onSavedChange={setSaved}
            picked={picked}
            onPickedChange={(images) => {
              setPicked(images);
              setErrors((e) => (e.images ? { ...e, images: undefined } : e));
            }}
            disabled={saving}
            serverError={errors.images}
          />

          <div className="gg-form-section">ผู้จำหน่าย</div>
          <div className="gg-field">
            <label className="gg-label" htmlFor="supplier">ผู้จำหน่ายหลัก<span className="gg-req" aria-hidden="true">*</span></label>
            <div className={`gg-control${invalid("supplierId")}`}>
              <select id="supplier" required value={values.supplierId} className={values.supplierId ? undefined : "is-placeholder"} onChange={(e) => set("supplierId", e.target.value)} {...describe("supplierId", "supplierHint")}>
                <option value="" disabled>เลือกผู้จำหน่าย</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
              <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
            </div>
            {errorOr(
              "supplierId",
              suppliers.length ? "โรงทอหรือผู้ค้าที่สั่งซื้อผ้านี้เป็นหลัก" : <>ยังไม่มีผู้จำหน่าย · <Link href="/people/suppliers/create">เพิ่มผู้จำหน่าย</Link></>,
              "supplierHint",
            )}
          </div>

          {editing ? (
            /*
             * STOCK ON EDIT — deliberately read-only.
             * "Initial stock" is a one-time entry made when the product is created. Re-running
             * it on every edit save would add the quantity again and inflate stock (save the
             * form 3 times → 3× the yards). So the edit form has no stock inputs, the form
             * sends no stock fields, and updateProduct ignores any it receives: editing a
             * product never touches ProductStock. Stock changes after creation are separate,
             * explicit movements: purchases, sales, transfers and stock adjustments
             * (/adjustments), each recorded on its own.
             */
            <>
              <div className="gg-form-section">สต็อกคงเหลือ</div>
              <div className="gg-field">
                {initial?.stock.length ? (
                  <ul className="stock-summary">
                    {initial.stock.map((s) => (
                      <li key={s.warehouse}>
                        <span>{s.warehouse}</span>
                        <b className="gg-num">{qty(s.quantity)} หลา</b>
                      </li>
                    ))}
                    <li className="total">
                      <span>รวมทุกคลัง</span>
                      <b className="gg-num">{qty(initial.stock.reduce((sum, s) => sum + s.quantity, 0))} หลา</b>
                    </li>
                  </ul>
                ) : (
                  <div className="stock-summary-empty">ยังไม่มีสต็อกในคลังใด</div>
                )}
                <div className="gg-hint">แก้ไขสินค้าไม่เปลี่ยนจำนวนสต็อก ปรับจำนวนผ่านหน้า <Link href="/adjustments">ปรับปรุงสต็อก</Link> หรือรับเข้าผ่านหน้าการซื้อ</div>
              </div>
            </>
          ) : (
          <>
          <div className="gg-form-section">สต็อกเริ่มต้น <span className="optional">(ไม่บังคับ)</span></div>
          <div className="gg-field">
            <label className="gg-label" htmlFor="warehouse">คลังสินค้า</label>
            <div className={`gg-control${invalid("warehouseId")}`}>
              <select id="warehouse" value={values.warehouseId} className={values.warehouseId ? undefined : "is-placeholder"} onChange={(e) => set("warehouseId", e.target.value)} {...describe("warehouseId")}>
                <option value="">เลือกคลังสินค้า</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
            </div>
            {errorOr("warehouseId")}
          </div>
          <div className="gg-field">
            <label className="gg-label" htmlFor="qty">จำนวนที่มีอยู่แล้ว</label>
            <div className={`gg-control${invalid("initialQuantity")}`}>
              <input id="qty" inputMode="decimal" placeholder="เช่น 1200" value={values.initialQuantity} onChange={(e) => set("initialQuantity", e.target.value)} {...describe("initialQuantity", "qtyHint")} />
              <span className="gg-addon">หลา</span>
            </div>
            {errorOr("initialQuantity", "ใช้เมื่อนำผ้าที่มีอยู่แล้วเข้าระบบ ผ้าที่ซื้อใหม่ให้รับเข้าผ่านหน้าการซื้อ", "qtyHint")}
          </div>
          </>
          )}
        </aside>
      </div>

      <div className="gg-card-foot">
        {badCount > 0 && (
          <span className="form-alert gg-badge danger" role="alert"><span className="gg-badge-dot" />มี {badCount} ช่องที่ต้องแก้ไข</span>
        )}
        <Link className="gg-btn gg-btn-secondary" href="/products">ยกเลิก</Link>
        <button type="submit" className="gg-btn gg-btn-primary" disabled={saving}>
          {saving ? <span className="spin" aria-hidden="true" /> : <Check className="gg-icon" aria-hidden />}
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
