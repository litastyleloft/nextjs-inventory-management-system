"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import { Check, Eye, EyeOff, Shield, X } from "lucide-react";

import { changePassword, type PasswordField } from "./actions";

const RULE = "อย่างน้อย 8 ตัว และต้องมีทั้งตัวอักษรและตัวเลข";

const FIELDS: { id: PasswordField; label: string; placeholder: string; autoComplete: string; hint?: string }[] = [
  { id: "currentPassword", label: "รหัสผ่านปัจจุบัน", placeholder: "กรอกรหัสผ่านปัจจุบัน", autoComplete: "current-password" },
  { id: "newPassword", label: "รหัสผ่านใหม่", placeholder: "กรอกรหัสผ่านใหม่", autoComplete: "new-password", hint: RULE },
  { id: "confirmPassword", label: "ยืนยันรหัสผ่านใหม่", placeholder: "กรอกรหัสผ่านใหม่อีกครั้ง", autoComplete: "new-password" },
];

function validate(values: Record<PasswordField, string>): { field: PasswordField; message: string } | null {
  if (!values.currentPassword) return { field: "currentPassword", message: "กรุณากรอกรหัสผ่านปัจจุบัน" };
  const p = values.newPassword;
  if (!p) return { field: "newPassword", message: "กรุณากรอกรหัสผ่านใหม่" };
  if (p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p)) return { field: "newPassword", message: RULE };
  if (new TextEncoder().encode(p).length > 72) return { field: "newPassword", message: "รหัสผ่านยาวเกินไป" };
  if (!values.confirmPassword) return { field: "confirmPassword", message: "กรุณายืนยันรหัสผ่านใหม่" };
  if (values.confirmPassword !== p) {
    return { field: "confirmPassword", message: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน กดไอคอนรูปตาเพื่อตรวจสอบ" };
  }
  return null;
}

// Reads what is actually in the fields at submit time. Password managers and the
// browser's "suggest strong password" can fill a field without the events React
// listens for, so a copy kept in React state could differ from what the user sees
// and cause a false "passwords don't match" error.
function readFields(form: HTMLFormElement): Record<PasswordField, string> {
  const data = new FormData(form);
  const get = (name: PasswordField) => {
    const value = data.get(name);
    return typeof value === "string" ? value : "";
  };
  return { currentPassword: get("currentPassword"), newPassword: get("newPassword"), confirmPassword: get("confirmPassword") };
}

type Match = "empty" | "same" | "different";

export default function ChangePasswordForm({ email }: { email: string }) {
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [error, setError] = useState<{ field: PasswordField; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<Match>("empty");

  // Re-checked on every input, change and focus change, straight from the fields, so a
  // value a password manager slipped in still shows up here before submitting.
  function updateMatch(form: HTMLFormElement) {
    const { newPassword, confirmPassword } = readFields(form);
    setMatch(!confirmPassword ? "empty" : confirmPassword === newPassword ? "same" : "different");
  }

  function fail(problem: { field?: PasswordField; message: string }) {
    toast.error(problem.message, { id: "change-password" });
    if (problem.field) {
      setError({ field: problem.field, message: problem.message });
      document.getElementById(problem.field)?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readFields(form);
    const problem = validate(values);
    if (problem) return fail(problem);

    setSaving(true);
    setError(null);
    try {
      const result = await changePassword(values);
      if (result.status === "success") {
        form.reset();
        setMatch("empty");
        setVisible({ currentPassword: false, newPassword: false, confirmPassword: false });
        // Every session that used the old password has ended, this one included, so sign
        // out cleanly and ask for the new password (the login page shows why).
        toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", { id: "change-password" });
        await signOut({ redirectTo: "/?pw=changed" });
        return;
      } else {
        fail(result);
      }
    } catch {
      fail({ message: "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
    }
    setSaving(false);
  }

  return (
    <form
      className="gg-card"
      noValidate
      onSubmit={handleSubmit}
      onInput={(e) => updateMatch(e.currentTarget)}
      onChange={(e) => updateMatch(e.currentTarget)}
      onFocus={(e) => updateMatch(e.currentTarget)}
      onBlur={(e) => updateMatch(e.currentTarget)}
    >
      {/*
        Tells the browser's password manager which account this form changes, so it saves
        the new password against it and does not guess which field to fill. Not submitted
        to the server action, which only reads the session.
      */}
      <input type="text" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="gg-sr" />
      <div className="gg-card-body" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        <div className="cp-grid">
          {FIELDS.map((field) => {
            const fieldError = error?.field === field.id ? error.message : "";
            const shown = visible[field.id];
            return (
              <div className="gg-field" key={field.id}>
                <label className="gg-label" htmlFor={field.id}>
                  {field.label}
                  <span className="gg-req" aria-hidden="true">*</span>
                </label>
                <div className={`gg-control${fieldError ? " invalid" : ""}`}>
                  <span className="gg-lead"><Shield className="gg-icon sm" aria-hidden /></span>
                  <input
                    id={field.id}
                    name={field.id}
                    type={shown ? "text" : "password"}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    required
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={fieldError ? `${field.id}Err` : field.hint ? `${field.id}Hint` : undefined}
                    onChange={() => {
                      if (error?.field === field.id) setError(null);
                    }}
                  />
                  <button
                    type="button"
                    className={`eye${shown ? " on" : ""}`}
                    aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    aria-pressed={shown}
                    onClick={() => setVisible((v) => ({ ...v, [field.id]: !v[field.id] }))}
                  >
                    {shown ? <EyeOff className="gg-icon sm" aria-hidden /> : <Eye className="gg-icon sm" aria-hidden />}
                  </button>
                </div>
                {fieldError ? (
                  <div className="gg-error" id={`${field.id}Err`}>{fieldError}</div>
                ) : field.id === "confirmPassword" && match !== "empty" ? (
                  <div className={`match-note ${match}`} aria-live="polite">
                    {match === "same" ? <Check className="gg-icon sm" aria-hidden /> : <X className="gg-icon sm" aria-hidden />}
                    {match === "same" ? "รหัสผ่านใหม่ตรงกัน" : "รหัสผ่านใหม่ยังไม่ตรงกัน"}
                  </div>
                ) : (
                  field.hint && <div className="gg-hint" id={`${field.id}Hint`}>{field.hint}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="gg-card-foot">
        <span className="foot-note">เปลี่ยนรหัสผ่านแล้ว ใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป</span>
        <button type="submit" className="gg-btn gg-btn-primary" disabled={saving}>
          {saving ? <span className="spin" aria-hidden="true" /> : <Check className="gg-icon sm" aria-hidden />}
          {saving ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
        </button>
      </div>
    </form>
  );
}
