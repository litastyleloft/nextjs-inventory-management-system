"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, ChevronDown, Pencil, Plus } from "lucide-react";

import LogoPicker from "@/components/form/LogoPicker";
import Modal from "@/components/modal/Modal";
import { createRecordModal } from "@/components/modal/record-modal";
import type { CategoryRow } from "@/lib/categories";
import { PATTERNS, WEAVES } from "@/lib/category-options";
import {
  CATEGORY_FIELDS,
  EMPTY_CATEGORY,
  categoryCodeLocked,
  categoryErrors,
  toCategoryInput,
  type CategoryField,
  type CategoryInput,
} from "@/lib/validation/category";
import { createCategory, updateCategory, type CategoryFormField } from "./actions";
import "./category-modal.css";

const TOAST_ID = "category-modal";

const { Provider, useOpenModal } = createRecordModal<CategoryRow>();

/** Wraps the list page so its Create and Edit buttons share one modal. */
export function CategoryModalProvider({ children }: { children: ReactNode }) {
  return <Provider render={(category, close) => <CategoryModal category={category} onClose={close} />}>{children}</Provider>;
}

export function CreateCategoryButton() {
  const open = useOpenModal();
  return (
    <button type="button" className="gg-btn gg-btn-primary" aria-haspopup="dialog" onClick={(e) => open(null, e.currentTarget)}>
      <Plus className="gg-icon" aria-hidden />
      เพิ่มหมวดหมู่สินค้า
    </button>
  );
}

export function EditCategoryButton({ category }: { category: CategoryRow }) {
  const open = useOpenModal();
  return (
    <button
      type="button"
      className="gg-btn gg-btn-ghost sm icon-only"
      aria-label={`แก้ไข ${category.name}`}
      title="แก้ไข"
      aria-haspopup="dialog"
      onClick={(e) => open(category, e.currentTarget)}
    >
      <Pencil className="gg-icon sm" aria-hidden />
    </button>
  );
}

const CODE_HINT = (
  <>ตัวอักษรอังกฤษ A–Z 3 ตัวพอดี ใช้เป็นส่วน AAA ของรหัสสินค้า เช่น <b>COT</b>58A101001</>
);

/** Create (category = null) or edit, from the design's #catModal. */
function CategoryModal({ category, onClose }: { category: CategoryRow | null; onClose: () => void }) {
  const [values, setValues] = useState<CategoryInput>(category ? toCategoryInput(category) : EMPTY_CATEGORY);
  const router = useRouter();
  const [errors, setErrors] = useState<Partial<Record<CategoryFormField, string>>>({});
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  // The code is part of every product code, so it can't change once products use it.
  const codeLocked = !!category && category.productCount > 0;

  function set(field: CategoryField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Like the design: an error goes away as soon as the field is edited.
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  function changeCode(raw: string) {
    const upper = raw.toUpperCase();
    const clean = upper.replace(/[^A-Z]/g, "").slice(0, 3);
    set("code", clean);
    if (upper !== clean && upper.slice(0, 3) !== clean) setErrors((e) => ({ ...e, code: "ใช้ได้เฉพาะตัวอักษรอังกฤษ A–Z" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = categoryErrors(values);
    setErrors(found);
    const first = (Object.keys(found) as CategoryField[])[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#cat-${first}`)?.focus();
      return;
    }
    setSaving(true);
    const formData = new FormData();
    for (const key of CATEGORY_FIELDS) formData.set(key, values[key]);
    if (image) formData.set("image", image);

    try {
      // The server checks everything again: permission, the id, every field and the image.
      const result = category ? await updateCategory(category.id, formData) : await createCategory(formData);
      if (result.status === "success") {
        toast.success(category ? `บันทึกการแก้ไขหมวดหมู่ ${result.name} แล้ว` : `เพิ่มหมวดหมู่ ${result.name} แล้ว`, { id: TOAST_ID });
        // The action revalidated the list, so the new or changed row is already on its way.
        onClose();
        return;
      }
      if (result.status === "invalid") {
        setErrors(result.errors);
        const firstBad = (Object.keys(result.errors) as CategoryFormField[])[0];
        if (firstBad && firstBad !== "image") formRef.current?.querySelector<HTMLElement>(`#cat-${firstBad}`)?.focus();
        toast.error("กรุณาตรวจสอบข้อมูลที่กรอก", { id: TOAST_ID });
      } else if (result.status === "not-found") {
        toast.error("ไม่พบหมวดหมู่นี้ อาจถูกลบไปแล้ว", { id: TOAST_ID });
        onClose();
        router.refresh();
        return;
      } else if (result.status === "busy") {
        toast.error("มีการบันทึกข้อมูลพร้อมกัน กรุณากดบันทึกอีกครั้ง", { id: TOAST_ID });
      } else if (result.status === "forbidden") {
        toast.error("คุณไม่มีสิทธิ์จัดการหมวดหมู่สินค้า", { id: TOAST_ID });
      } else {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: TOAST_ID });
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: TOAST_ID });
    }
    setSaving(false);
  }

  const field = (id: CategoryField) => ({
    id: `cat-${id}`,
    value: values[id],
    disabled: saving,
    "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `cat-${id}-error` : undefined,
  });
  const control = (id: CategoryField, extra = "") => `gg-control${errors[id] ? " invalid" : ""}${extra}`;
  const error = (id: CategoryField) => errors[id] && <div className="gg-error" id={`cat-${id}-error`}>{errors[id]}</div>;

  return (
    <Modal
      size="lg"
      title={category ? `แก้ไขหมวดหมู่สินค้า: ${category.name}` : "เพิ่มหมวดหมู่สินค้า"}
      onClose={onClose}
      busy={saving}
      onSubmit={handleSubmit}
      initialFocus={nameRef}
      footer={
        <>
          <button type="button" className="gg-btn gg-btn-secondary" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button type="submit" className="gg-btn gg-btn-primary" disabled={saving}>
            <Check className="gg-icon" aria-hidden />
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </>
      }
    >
      <div ref={formRef}>
        <div className="cat-modal-top">
          <LogoPicker
            label="รูปหมวดหมู่"
            placeholder="เลือกรูปผ้าตัวอย่าง"
            currentUrl={category?.image ?? null}
            file={image}
            onChange={(file) => {
              setImage(file);
              setErrors((e) => (e.image ? { ...e, image: undefined } : e));
            }}
            disabled={saving}
            serverError={errors.image}
          />
          <div className="gg-stack">
            <div className="gg-field">
              <label className="gg-label" htmlFor="cat-name">
                ชื่อหมวดหมู่<span className="gg-req" aria-hidden="true">*</span>
              </label>
              <div className={control("name")}>
                <input ref={nameRef} {...field("name")} required maxLength={100} placeholder="กรอกชื่อหมวดหมู่ เช่น ฝ้าย" onChange={(e) => set("name", e.target.value)} />
              </div>
              {error("name")}
            </div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="cat-code">
                รหัสหมวดหมู่ (3 ตัวอักษร)<span className="gg-req" aria-hidden="true">*</span>
              </label>
              <div className={control("code", codeLocked ? " disabled" : "")} style={{ maxWidth: 220 }}>
                <input
                  {...field("code")}
                  className="cat-code-input"
                  required
                  readOnly={codeLocked}
                  autoComplete="off"
                  placeholder="เช่น COT"
                  onChange={(e) => changeCode(e.target.value)}
                />
              </div>
              {errors.code ? error("code") : <div className="gg-hint">{codeLocked ? categoryCodeLocked(category.productCount) : CODE_HINT}</div>}
            </div>
          </div>
        </div>

        <div className="cat-modal-spec">
          <div className="gg-form-section">ข้อมูลจำเพาะของผ้า</div>
          <div className="spec-hint">ค่าเริ่มต้นสำหรับผ้าทุกรายการในหมวดหมู่นี้ เว้นว่างได้หากผ้าในหมวดหมู่แตกต่างกัน</div>
          <div className="gg-form-grid">
            <div className="gg-field span-2">
              <label className="gg-label" htmlFor="cat-composition">ส่วนประกอบ<span className="optional">(ไม่บังคับ)</span></label>
              <div className={control("composition")}>
                <input {...field("composition")} maxLength={200} placeholder="เช่น ฝ้าย 98%, สแปนเด็กซ์ 2%" onChange={(e) => set("composition", e.target.value)} />
              </div>
              {error("composition")}
            </div>
            <Select id="weave" label="ลักษณะการทอ / ถัก" placeholder="เลือกลักษณะการทอหรือถัก" options={WEAVES} props={field("weave")} className={control("weave")} onChange={(v) => set("weave", v)} error={error("weave")} />
            <Select id="pattern" label="ลวดลาย" placeholder="เลือกลวดลาย" options={PATTERNS} props={field("pattern")} className={control("pattern")} onChange={(v) => set("pattern", v)} error={error("pattern")} />
            <div className="gg-field">
              <label className="gg-label" htmlFor="cat-widthInches">หน้ากว้าง</label>
              <div className={control("widthInches")}>
                <input {...field("widthInches")} inputMode="decimal" placeholder="เช่น 58" onChange={(e) => set("widthInches", e.target.value)} />
                <span className="gg-addon">นิ้ว</span>
              </div>
              {error("widthInches")}
            </div>
            <div className="gg-field">
              <label className="gg-label" htmlFor="cat-gsm">น้ำหนักผ้า</label>
              <div className={control("gsm")}>
                <input {...field("gsm")} inputMode="numeric" placeholder="เช่น 160" onChange={(e) => set("gsm", e.target.value)} />
                <span className="gg-addon">แกรม (GSM)</span>
              </div>
              {error("gsm")}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Select({
  id,
  label,
  placeholder,
  options,
  props,
  className,
  onChange,
  error,
}: {
  id: CategoryField;
  label: string;
  placeholder: string;
  options: readonly string[];
  props: { id: string; value: string; disabled: boolean };
  className: string;
  onChange: (value: string) => void;
  error: ReactNode;
}) {
  return (
    <div className="gg-field">
      <label className="gg-label" htmlFor={`cat-${id}`}>{label}</label>
      <div className={className}>
        <select {...props} className={props.value === "" ? "is-placeholder" : undefined} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
      </div>
      {error}
    </div>
  );
}
