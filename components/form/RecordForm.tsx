"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, ChevronDown, Globe } from "lucide-react";

/** What every create/update server action returns. */
export type RecordActionResult<K extends string> =
  | { status: "success"; id: string; name: string }
  | { status: "invalid"; errors: Partial<Record<K, string>> }
  | { status: "not-found" | "forbidden" | "signed-out" };

/** An editable field. `kind` defaults to a one-line input. */
export type RecordField<K extends string> = {
  id: K;
  label: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  kind?: "input" | "textarea" | "select";
  /** For inputs: "text" (default), "email", "tel", "date", … */
  type?: string;
  inputMode?: "numeric";
  /** For selects. */
  options?: { value: string; label: string }[];
};

/** A read-only box worked out from other fields (the design's "auto" field, e.g. region). */
export type ComputedField<K extends string> = {
  kind: "computed";
  key: string;
  label: string;
  note?: string;
  compute: (values: Record<K, string>) => { value: string; hint?: string } | { empty: string };
};

type AnyField<K extends string> = RecordField<K> | ComputedField<K>;
const isComputed = <K extends string>(f: AnyField<K>): f is ComputedField<K> => f.kind === "computed";

type Props<K extends string> = {
  /** One form, two modes: "create" starts blank, "edit" starts from the saved record. */
  mode: "create" | "edit";
  fields: AnyField<K>[];
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
  const editable = fields.filter((f): f is RecordField<K> => !isComputed(f));
  const ids = editable.map((f) => f.id);
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

  function change(id: K, value: string) {
    setValues((v) => ({ ...v, [id]: value }));
    setServerErrors((s) => ({ ...s, [id]: undefined }));
  }

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

  function renderComputed(field: ComputedField<K>) {
    const result = field.compute(values);
    const found = "value" in result;
    return (
      <div className="gg-field" key={field.key}>
        <span className="gg-label">
          {field.label}
          {field.note && <span className="optional">{field.note}</span>}
        </span>
        <div className={`auto-box${found ? " found" : ""}`} id={field.key} aria-live="polite">
          {found ? (
            <>
              <Globe className="gg-icon sm" aria-hidden />
              {result.value}
            </>
          ) : (
            <span className="auto-empty">{result.empty}</span>
          )}
        </div>
        {found && result.hint && <div className="gg-hint">{result.hint}</div>}
      </div>
    );
  }

  function renderField(field: RecordField<K>, autoFocus: boolean) {
    const error = errorFor(field.id);
    const describedBy = error ? `${field.id}Err` : field.hint ? `${field.id}Hint` : undefined;
    const common = {
      id: field.id,
      name: field.id,
      required: field.required,
      autoFocus,
      value: values[field.id],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
      onBlur: (e: { target: { value: string } }) => {
        if (e.target.value.trim() || field.required) setTouched((t) => ({ ...t, [field.id]: true }));
      },
    };
    const kind = field.kind ?? "input";

    return (
      <div className="gg-field" key={field.id}>
        <label className="gg-label" htmlFor={field.id}>
          {field.label}
          {field.required ? <span className="gg-req" aria-hidden="true">*</span> : <span className="optional">(ไม่บังคับ)</span>}
        </label>
        <div className={`gg-control${kind === "textarea" ? " textarea" : ""}${error ? " invalid" : ""}`}>
          {kind === "textarea" ? (
            <textarea {...common} rows={4} placeholder={field.placeholder} onChange={(e) => change(field.id, e.target.value)} />
          ) : kind === "select" ? (
            <>
              <select
                {...common}
                className={values[field.id] === "" ? "is-placeholder" : undefined}
                onChange={(e) => {
                  change(field.id, e.target.value);
                  setTouched((t) => ({ ...t, [field.id]: true }));
                }}
              >
                {field.placeholder && <option value="" disabled>{field.placeholder}</option>}
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
            </>
          ) : (
            <input
              {...common}
              type={field.type ?? "text"}
              inputMode={field.inputMode}
              autoComplete="off"
              placeholder={field.placeholder}
              onChange={(e) => change(field.id, e.target.value)}
            />
          )}
        </div>
        {error ? (
          <div className="gg-error" id={`${field.id}Err`}>{error}</div>
        ) : (
          field.hint && <div className="gg-hint" id={`${field.id}Hint`}>{field.hint}</div>
        )}
      </div>
    );
  }

  return (
    <form className="gg-card" noValidate autoComplete="off" onSubmit={handleSubmit}>
      <div className="gg-card-body" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        <div className="pf-grid">
          {fields.map((field, index) => (isComputed(field) ? renderComputed(field) : renderField(field, index === 0)))}
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
