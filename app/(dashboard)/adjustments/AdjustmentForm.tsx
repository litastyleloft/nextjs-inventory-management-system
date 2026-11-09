"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Box, Check, ChevronDown, Minus, Package, Plus, Search, Trash2 } from "lucide-react";

import type { AdjustmentProduct } from "@/lib/adjustments";
import { ADJUSTMENT_REASONS, ADJUSTMENT_TYPES, type AdjustmentTypeValue } from "@/lib/adjustment-options";
import { thaiDate } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { adjustmentHeaderErrors, quantityProblem, todayInBangkok, type AdjustmentErrors } from "@/lib/validation/adjustment";
import { adjustmentLineStock, createAdjustment, searchAdjustmentProducts } from "./actions";

type Line = { product: AdjustmentProduct; qty: string; type: AdjustmentTypeValue; touched: boolean };

type Props = {
  warehouses: { id: string; name: string }[];
  /** The next reference number (a preview; the real one is taken on save). */
  referencePreview: string;
};

const num = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;

/** The design's stock badge: red at 0 or less, amber at or below the alert, else neutral. */
function StockBadge({ product, qty }: { product: AdjustmentProduct; qty: number }) {
  const tone = qty <= 0 ? "danger" : qty <= product.stockAlert ? "warning" : "neutral";
  return (
    <span className={`gg-badge ${tone}`}>
      {tone !== "neutral" && <span className="gg-badge-dot" />}
      {num(qty)} {unitLabel(product.unit).short}
    </span>
  );
}

function Thumb({ product, size = 40 }: { product: AdjustmentProduct; size?: number }) {
  return (
    <span className="thumb" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- uploaded product photo */}
      {product.coverUrl ? <img src={product.coverUrl} alt="" /> : <Package className="gg-icon sm" aria-hidden />}
    </span>
  );
}

/** What is wrong with a line, or "" (quantity, and not taking away more than the stock). */
function lineProblem(l: Line) {
  const q = quantityProblem(l.qty);
  if (q) return q;
  if (l.type === "SUBTRACTION" && Number(l.qty) > l.product.stock)
    return `ลดได้ไม่เกินคงเหลือ ${num(l.product.stock)} ${unitLabel(l.product.unit).short}`;
  return "";
}

/**
 * design/src/pages/adjustment.page.html: document number, warehouse, date and reason; a
 * product search scoped to the chosen warehouse; the lines table with each product's stock
 * in that warehouse and the stock after the adjustment; notes.
 */
export default function AdjustmentForm({ warehouses, referencePreview }: Props) {
  const router = useRouter();
  const today = todayInBangkok();
  const [warehouseId, setWarehouseId] = useState("");
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [errors, setErrors] = useState<AdjustmentErrors>({});
  // Problems the server found on particular lines (e.g. stock changed since it was shown).
  const [serverLineErrors, setServerLineErrors] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  // Product search
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdjustmentProduct[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const request = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function runSearch(q: string, warehouse = warehouseId) {
    clearTimeout(timer.current);
    if (!warehouse) return;
    const mine = ++request.current;
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const result = await searchAdjustmentProducts(warehouse, q);
        if (mine !== request.current) return; // a newer search has started
        if (result.status === "ok") {
          setResults(result.products);
          setActive(0);
        } else if (result.status === "forbidden") toast.error("คุณไม่มีสิทธิ์ปรับปรุงสต็อก", { id: "adj-search" });
        else if (result.status === "signed-out") toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: "adj-search" });
        else toast.error("คลังสินค้านี้ถูกลบไปแล้ว กรุณาเลือกใหม่", { id: "adj-search" });
      } catch {
        if (mine === request.current) toast.error("ค้นหาสินค้าไม่สำเร็จ กรุณาลองใหม่", { id: "adj-search" });
      } finally {
        if (mine === request.current) setSearching(false);
      }
    }, 200);
  }

  async function chooseWarehouse(id: string) {
    setWarehouseId(id);
    setErrors((e) => ({ ...e, warehouseId: undefined }));
    setResults(null);
    if (!id) return;
    if (open || query) runSearch(query, id);
    // Lines already added show the stock of the chosen warehouse: fetch it for the new one.
    if (lines.length) {
      try {
        const result = await adjustmentLineStock(id, lines.map((l) => l.product.id));
        if (result.status !== "ok") return;
        const fresh = new Map(result.products.map((p) => [p.id, p]));
        setLines((ls) => ls.filter((l) => fresh.has(l.product.id)).map((l) => ({ ...l, product: fresh.get(l.product.id)! })));
      } catch {
        toast.error("โหลดสต็อกของคลังนี้ไม่สำเร็จ กรุณาเลือกคลังอีกครั้ง", { id: "adj-stock" });
      }
    }
  }

  function addProduct(p: AdjustmentProduct) {
    setLines((ls) => {
      const existing = ls.find((l) => l.product.id === p.id);
      // Like the design: picking a product already in the list adds 1 to it, never a second row.
      if (existing) return ls.map((l) => (l === existing ? { ...l, qty: String(round2((Number(l.qty) || 0) + 1)), touched: true } : l));
      return [...ls, { product: p, qty: "1", type: "ADDITION", touched: false }];
    });
    setErrors((e) => ({ ...e, items: undefined }));
    setQuery("");
    setOpen(false);
    // Focus the row's quantity, ready to type.
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(`[data-qty="${p.id}"]`);
      input?.focus();
      input?.select();
    });
  }

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    const items = results ?? [];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (items.length) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && items[active]) addProduct(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, ...patch, touched: true } : l)));
    setServerLineErrors((e) => (e[id] ? { ...e, [id]: "" } : e));
  };
  const step = (l: Line, by: number) => updateLine(l.product.id, { qty: String(Math.max(0, round2((Number(l.qty) || 0) + by))) });
  const remove = (id: string) => {
    setLines((ls) => ls.filter((l) => l.product.id !== id));
    searchRef.current?.focus();
  };

  const added = lines.filter((l) => l.type === "ADDITION").reduce((s, l) => s + (Number(l.qty) || 0), 0);
  const removed = lines.filter((l) => l.type === "SUBTRACTION").reduce((s, l) => s + (Number(l.qty) || 0), 0);
  const lineErrors = Object.fromEntries(lines.map((l) => [l.product.id, lineProblem(l) || serverLineErrors[l.product.id]]).filter(([, m]) => m));
  const headerBad = Object.values(errors).filter((v) => typeof v === "string" && v).length;
  const badCount = tried ? headerBad + Object.keys(lineErrors).length : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    const found = adjustmentHeaderErrors({
      warehouseId,
      date,
      reason,
      notes,
      items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty || "1", type: l.type })),
    });
    setErrors(found);
    if (Object.keys(found).length || Object.keys(lineErrors).length) {
      const first = found.warehouseId ? "warehouse" : found.date ? "date" : found.reason ? "reason" : found.items ? "pq" : null;
      if (first) document.getElementById(first)?.focus();
      else document.querySelector<HTMLInputElement>(".gg-stepper.invalid input")?.focus();
      return;
    }
    setSaving(true);
    try {
      // The server checks everything again and applies the whole adjustment in one
      // transaction: either every line changes the stock, or nothing is saved.
      const result = await createAdjustment({
        warehouseId,
        date,
        reason,
        notes,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty, type: l.type })),
      });
      if (result.status === "success") {
        toast.success(`บันทึก ${result.reference} แล้ว ปรับสต็อก ${result.lineCount} รายการ`, { id: "adj-form" });
        // Reset first: with cacheComponents this page stays mounted (hidden) after leaving.
        setLines([]);
        setWarehouseId("");
        setReason("");
        setNotes("");
        setTried(false);
        setResults(null);
        router.push("/adjustments");
        return;
      }
      if (result.status === "invalid") {
        const { lines: badLines, ...header } = result.errors;
        setErrors(header);
        setServerLineErrors(badLines ?? {});
        // Show the stock as it is now, so the limit in the row is the real one.
        if (result.stock) {
          const fresh = result.stock;
          setLines((ls) => ls.map((l) => (l.product.id in fresh ? { ...l, product: { ...l.product, stock: fresh[l.product.id] } } : l)));
        }
        toast.error(badLines ? "สต็อกไม่พอสำหรับบางรายการ ยังไม่ได้บันทึกการปรับปรุง" : "กรุณาตรวจสอบข้อมูลที่กรอก", { id: "adj-form", duration: 6000 });
      } else if (result.status === "busy") {
        toast.error("มีการบันทึกพร้อมกัน กรุณากดบันทึกอีกครั้ง", { id: "adj-form" });
      } else if (result.status === "forbidden") {
        toast.error("คุณไม่มีสิทธิ์ปรับปรุงสต็อก", { id: "adj-form" });
      } else {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: "adj-form" });
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: "adj-form" });
    }
    setSaving(false);
  }

  const showResults = open && warehouseId;

  return (
    <form className="gg-card" id="adjForm" noValidate autoComplete="off" onSubmit={handleSubmit} aria-busy={saving}>
      <div className="gg-card-body" style={{ paddingTop: "var(--space-6)" }}>
        <div className="adj-head">
          <div className="gg-field">
            <span className="gg-label">เลขที่เอกสาร</span>
            <div className="ref" id="docRef">{referencePreview}</div>
            <div className="gg-hint">ระบบออกเลขให้อัตโนมัติ</div>
          </div>
          <div className="gg-field">
            <label className="gg-label" htmlFor="warehouse">คลังสินค้า<span className="gg-req" aria-hidden="true">*</span></label>
            <div className={`gg-control${errors.warehouseId ? " invalid" : ""}`}>
              <select id="warehouse" required value={warehouseId} className={warehouseId ? undefined : "is-placeholder"} onChange={(e) => chooseWarehouse(e.target.value)} aria-invalid={errors.warehouseId ? true : undefined} aria-describedby={errors.warehouseId ? "warehouse-error" : "warehouse-hint"}>
                <option value="" disabled>เลือกคลังสินค้า</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
            </div>
            {errors.warehouseId ? <div className="gg-error" id="warehouse-error">{errors.warehouseId}</div> : <div className="gg-hint" id="warehouse-hint">สต็อกที่แสดงและที่ปรับเป็นของคลังนี้</div>}
          </div>
          <div className="gg-field">
            <label className="gg-label" htmlFor="date">วันที่<span className="gg-req" aria-hidden="true">*</span></label>
            <div className={`gg-control${errors.date ? " invalid" : ""}`}>
              <input id="date" type="date" required max={today} value={date} onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: undefined })); }} aria-invalid={errors.date ? true : undefined} aria-describedby={errors.date ? "date-error" : "date-th"} />
            </div>
            {errors.date ? <div className="gg-error" id="date-error">{errors.date}</div> : <div className="gg-hint" id="date-th">{/^\d{4}-\d{2}-\d{2}$/.test(date) ? thaiDate(new Date(`${date}T12:00:00+07:00`)) : ""}</div>}
          </div>
          <div className="gg-field">
            <label className="gg-label" htmlFor="reason">เหตุผลการปรับปรุง<span className="gg-req" aria-hidden="true">*</span></label>
            <div className={`gg-control${errors.reason ? " invalid" : ""}`}>
              <select id="reason" required value={reason} className={reason ? undefined : "is-placeholder"} onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })); }} aria-invalid={errors.reason ? true : undefined} aria-describedby={errors.reason ? "reason-error" : undefined}>
                <option value="" disabled>เลือกเหตุผล</option>
                {ADJUSTMENT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
            </div>
            {errors.reason && <div className="gg-error" id="reason-error">{errors.reason}</div>}
          </div>
        </div>

        <div className="psearch" ref={boxRef}>
          <label className="gg-label" htmlFor="pq" style={{ display: "block", marginBottom: "var(--space-2)" }}>สินค้า</label>
          <div className={`gg-control${!warehouseId ? " disabled" : ""}`} aria-busy={searching}>
            <span className="gg-lead"><Search className="gg-icon sm" aria-hidden /></span>
            <input
              id="pq"
              ref={searchRef}
              autoComplete="off"
              disabled={!warehouseId}
              placeholder={warehouseId ? "ค้นหาผ้าด้วยรหัสหรือชื่อ แล้วกด Enter เพื่อเพิ่ม" : "เลือกคลังสินค้าก่อน แล้วจึงค้นหาสินค้า"}
              role="combobox"
              aria-expanded={Boolean(showResults)}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={showResults && results?.[active] ? `${listId}-${active}` : undefined}
              value={query}
              onFocus={() => {
                setOpen(true);
                if (!results) runSearch(query);
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                // Drop the old results so a quick click can't add a product from the previous search.
                setResults(null);
                runSearch(e.target.value);
              }}
              onKeyDown={onSearchKey}
            />
          </div>
          {showResults && (
            <div className="presults" id={listId} role="listbox" aria-label="ผลการค้นหาสินค้า">
              {results === null ? (
                <div className="none">กำลังค้นหา…</div>
              ) : results.length === 0 ? (
                <div className="none">ไม่พบผ้าที่ตรงกับ &ldquo;{query}&rdquo;</div>
              ) : (
                results.map((p, i) => {
                  const inList = lines.some((l) => l.product.id === p.id);
                  return (
                    <button
                      key={p.id}
                      id={`${listId}-${i}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      tabIndex={-1}
                      className={`presult${i === active ? " on" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addProduct(p);
                      }}
                      onMouseEnter={() => setActive(i)}
                    >
                      <Thumb product={p} size={32} />
                      <span>
                        <span className="n">{p.name}</span>
                        <br />
                        <span className="gg-badge neutral mono code-sm">{p.code}</span>
                      </span>
                      <span className="meta">
                        {inList && <span className="added">อยู่ในรายการแล้ว</span>}
                        <StockBadge product={p} qty={p.stock} />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="lines-title">
          <h2>รายการสินค้า<span className="gg-req" aria-hidden="true">*</span></h2>
          <span className="gg-hint" style={errors.items ? { color: "var(--danger-text)" } : undefined} role={errors.items ? "alert" : undefined}>
            {errors.items ?? "ปรับได้หลายรายการในเอกสารเดียว"}
          </span>
        </div>
        <div className={`lines${errors.items ? " invalid" : ""}`}>
          <div className="gg-table-wrap">
            <table className="gg-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th className="right">คงเหลือ</th>
                  <th>จำนวน</th>
                  <th>ประเภท</th>
                  <th className="right">คงเหลือหลังปรับ</th>
                  <th className="gg-actions-cell right"><span className="gg-sr">ลบรายการ</span></th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-lines">
                      <Box className="gg-icon" aria-hidden />
                      <div>{warehouseId ? "ยังไม่มีสินค้า ค้นหาผ้าด้านบนเพื่อเพิ่มรายการ" : "เลือกคลังสินค้า แล้วค้นหาผ้าด้านบนเพื่อเพิ่มรายการ"}</div>
                    </td>
                  </tr>
                ) : (
                  lines.map((l) => {
                    const p = l.product;
                    const unit = unitLabel(p.unit).short;
                    const qty = Number(l.qty) || 0;
                    const after = round2(p.stock + (l.type === "ADDITION" ? qty : -qty));
                    const err = tried || l.touched || serverLineErrors[p.id] ? lineErrors[p.id] : "";
                    return (
                      <tr key={p.id} data-line={p.id}>
                        <td className="pcol">
                          <div className="pcell">
                            <Thumb product={p} />
                            <div>
                              <div className="n">{p.name}</div>
                              <span className="gg-badge neutral mono code">{p.code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="right"><StockBadge product={p} qty={p.stock} /></td>
                        <td>
                          <div className="qty-wrap">
                            <div className={`gg-stepper${err ? " invalid" : ""}`}>
                              <button type="button" aria-label={`ลดจำนวน ${p.name}`} onClick={() => step(l, -1)}><Minus className="gg-icon sm" aria-hidden /></button>
                              <input
                                data-qty={p.id}
                                inputMode="decimal"
                                value={l.qty}
                                aria-label={`จำนวนของ ${p.name}`}
                                aria-invalid={err ? true : undefined}
                                onChange={(e) => updateLine(p.id, { qty: e.target.value.replace(",", ".").replace(/[^\d.]/g, "") })}
                              />
                              <button type="button" aria-label={`เพิ่มจำนวน ${p.name}`} onClick={() => step(l, 1)}><Plus className="gg-icon sm" aria-hidden /></button>
                            </div>
                            <span className="u">{unit}</span>
                          </div>
                        </td>
                        <td>
                          <div className="gg-control type-ctl">
                            <select value={l.type} aria-label={`ประเภทการปรับ ${p.name}`} onChange={(e) => updateLine(p.id, { type: e.target.value as AdjustmentTypeValue })}>
                              {ADJUSTMENT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                            <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
                          </div>
                        </td>
                        <td className="right">
                          <div className="after">
                            <StockBadge product={p} qty={after} />
                            <span className={`delta ${l.type === "ADDITION" ? "up" : "down"}`}>
                              {l.type === "ADDITION" ? "+" : "−"}{num(qty)} {unit}
                            </span>
                            {err && <span className="row-err" role="alert">{err}</span>}
                          </div>
                        </td>
                        <td className="gg-actions-cell right">
                          <button type="button" className="gg-btn gg-btn-ghost sm icon-only danger" aria-label={`ลบรายการ ${p.name}`} onClick={() => remove(p.id)}>
                            <Trash2 className="gg-icon sm" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="lines-summary">
            <span>ทั้งหมด <b>{lines.length}</b> รายการ</span>
            <span>เพิ่ม <b className="up">+{num(added)} หลา</b></span>
            <span>ลด <b className="down">−{num(removed)} หลา</b></span>
          </div>
        </div>

        <div className="gg-field notes">
          <label className="gg-label" htmlFor="notes">หมายเหตุ<span className="optional">(ไม่บังคับ)</span></label>
          <div className={`gg-control textarea${errors.notes ? " invalid" : ""}`}>
            <textarea id="notes" rows={3} maxLength={1000} placeholder="เช่น ตรวจนับประจำเดือน พบผ้าเปียกน้ำ 2 ม้วน" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {errors.notes && <div className="gg-error">{errors.notes}</div>}
        </div>
      </div>

      <div className="gg-card-foot">
        {badCount > 0 && (
          <span className="form-alert gg-badge danger" role="alert"><span className="gg-badge-dot" />มี {badCount} จุดที่ต้องแก้ไข</span>
        )}
        <Link className="gg-btn gg-btn-secondary" href="/adjustments">ยกเลิก</Link>
        <button type="submit" className="gg-btn gg-btn-primary" disabled={saving}>
          {saving ? <span className="spin" aria-hidden="true" /> : <Check className="gg-icon" aria-hidden />}
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
