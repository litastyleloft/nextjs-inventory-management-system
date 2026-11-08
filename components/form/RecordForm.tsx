"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check } from "lucide-react";

/** What every create/update server action returns. */
export type RecordActionResult<K extends string> =
  | { status: "success"; id: string; name: string }
  | { status: "invalid"; errors: Partial<Record<K, string>> }
  | { status: "not-found" | "forbidden" | "signed-out" };

export type RecordField<K extends string> = {
  id: K;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  inputMode?: "numeric";
  hint?: string;
};

type Props<K extends string> = {
  /** One form, two modes: "create" starts blank, "edit" starts from the saved record. */
  mode: "create" | "edit";
  fields: RecordField<K>[];
  initial: Record<K, string>;
  empty: Record<K, string>;
  /** Field errors from the shared zod schema (same check the server runs). */
  validate: (values: Record<K, string>) => Partial<Record<K, string>>;
  /** The server action: create, or update bound to the record id. */
  action: (input: Record<K, string>) => Promise<RecordActionResult<K>>;
  listHref: string;
  /** Thai noun for messages, e.g. "คลังสินค้า". */
  noun: string;
};

/**
 * The create/edit card from design/src/pages/people-form.tpl.html: two-column fields,
 * "(ไม่บังคับ)" on optional ones, a footer note counting problems, Cancel and Save.
 */
export default function RecordForm<K extends string>({ mode, fields, initial, empty, validate, action, listHref, noun }: Props<K>) {
  const router = useRouter();
  const ids = fields.map((f) => f.id);
  const allTouched = () => Object.fromEntries(ids.map((f) => [f, true])) as Record<K, boolean>;
  const [values, setValues] = useState<Record<K, string>>(initial);
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>(mode === "edit" ? allTouched() : {});
  const [serverErrors, setServerErrors] = useState<Partial<Record<K, string>>>({});
  const [saving, setSaving] = useState(false);

  const clientErrors = validate(values);
  const problemCount = Object.keys(clientErrors).length;
  const errorFor = (id: K) => serverErrors[id] ?? (touched[id] ? clientErrors[id] : undefined);
  const unchanged = mode === "edit" && ids.every((f) => values[f].trim() === initial[f].trim());
  const toastId = `record-form-${noun}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(allTouched());
    if (problemCount) return;

    setSaving(true);
    try {
      const result = await action(values);
      if (result.status === "success") {
        toast.success(`บันทึก "${result.name}" แล้ว`, { id: toastId });
        // Reset before leaving: with cacheComponents this page stays mounted (hidden) and
        // would otherwise show the old values the next time it is opened.
        if (mode === "create") setValues(empty);
        setTouched(mode === "edit" ? allTouched() : {});
        router.push(listHref);
        return;
      }
      if (result.status === "invalid") {
        setServerErrors(result.errors);
        toast.error("กรุณาตรวจสอบข้อมูลที่กรอก", { id: toastId });
      } else if (result.status === "not-found") {
        toast.error(`ไม่พบ${noun}นี้ อาจถูกลบไปแล้ว`, { id: toastId });
        router.push(listHref);
        return;
      } else if (result.status === "forbidden") {
        toast.error(`คุณไม่มีสิทธิ์จัดการ${noun}`, { id: toastId });
      } else {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: toastId });
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: toastId });
    }
    setSaving(false);
  }

  return (
    <form className="gg-card" noValidate autoComplete="off" onSubmit={handleSubmit}>
      <div className="gg-card-body" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        <div className="pf-grid">
          {fields.map((field, index) => {
            const error = errorFor(field.id);
            const describedBy = error ? `${field.id}Err` : field.hint ? `${field.id}Hint` : undefined;
            return (
              <div className="gg-field" key={field.id}>
                <label className="gg-label" htmlFor={field.id}>
                  {field.label}
                  {field.required ? <span className="gg-req" aria-hidden="true">*</span> : <span className="optional">(ไม่บังคับ)</span>}
                </label>
                <div className={`gg-control${error ? " invalid" : ""}`}>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type ?? "text"}
                    inputMode={field.inputMode}
                    autoComplete="off"
                    placeholder={field.placeholder}
                    autoFocus={index === 0}
                    required={field.required}
                    value={values[field.id]}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [field.id]: e.target.value }));
                      setServerErrors((s) => ({ ...s, [field.id]: undefined }));
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim() || field.required) setTouched((t) => ({ ...t, [field.id]: true }));
                    }}
                  />
                </div>
                {error ? (
                  <div className="gg-error" id={`${field.id}Err`}>{error}</div>
                ) : (
                  field.hint && <div className="gg-hint" id={`${field.id}Hint`}>{field.hint}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="gg-card-foot">
        <span className="foot-note">
          {problemCount ? `กรอกข้อมูลให้ถูกต้องเพื่อบันทึก (เหลือ ${problemCount} ช่อง)` : unchanged ? "ยังไม่มีการเปลี่ยนแปลง" : "พร้อมบันทึก"}
        </span>
        <Link className="gg-btn gg-btn-secondary" href={listHref}>ยกเลิก</Link>
        <button type="submit" className="gg-btn gg-btn-primary" disabled={saving || problemCount > 0 || unchanged}>
          {saving ? <span className="spin" aria-hidden="true" /> : <Check className="gg-icon" aria-hidden />}
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
