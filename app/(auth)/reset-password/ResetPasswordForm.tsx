"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Eye, Shield, TriangleAlert } from "lucide-react";

import { resetPassword } from "../actions";

const RULE = "อย่างน้อย 8 ตัว และต้องมีทั้งตัวอักษรและตัวเลข";
const TOO_LONG = "รหัสผ่านยาวเกินไป";

function validatePassword(value: string) {
  if (!value) return "กรุณากรอกรหัสผ่านใหม่";
  if (value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) return RULE;
  return new TextEncoder().encode(value).length > 72 ? TOO_LONG : "";
}

function BackToLogin() {
  return (
    <Link className="link back" href="/">
      <ChevronLeft className="gg-icon sm" aria-hidden />
      กลับไปหน้าเข้าสู่ระบบ
    </Link>
  );
}

export function InvalidResetLink() {
  return (
    <section className="auth-card" aria-labelledby="resetTitle">
      <h1 id="resetTitle">ลิงก์ใช้ไม่ได้</h1>
      <div className="auth-form">
        <div className="alert danger" role="alert">
          <TriangleAlert className="gg-icon sm" aria-hidden />
          <span>ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว กรุณากด &ldquo;ลืมรหัสผ่าน?&rdquo; ที่หน้าเข้าสู่ระบบเพื่อขอลิงก์ใหม่</span>
        </div>
        <BackToLogin />
      </div>
    </section>
  );
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<"success" | "invalid-link" | null>(null);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const password = passwordRef.current!.value;
    const nextPasswordError = validatePassword(password);
    const nextConfirmError = confirmRef.current!.value === password ? "" : "รหัสผ่านไม่ตรงกัน";
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setFormError("");
    if (nextPasswordError || nextConfirmError) {
      (nextPasswordError ? passwordRef : confirmRef).current!.focus();
      return;
    }

    setSubmitting(true);
    try {
      const { status } = await resetPassword(token, password);
      if (status === "weak-password") setPasswordError(RULE);
      else setResult(status);
    } catch {
      setFormError("ไม่สามารถตั้งรหัสผ่านได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    }
    setSubmitting(false);
  }

  if (result === "invalid-link") return <InvalidResetLink />;

  if (result === "success") {
    return (
      <section className="auth-card" aria-labelledby="resetTitle">
        <h1 id="resetTitle">ตั้งรหัสผ่านใหม่</h1>
        <div className="auth-form">
          <div className="alert success" role="status">
            <Check className="gg-icon sm" aria-hidden />
            <span>ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</span>
          </div>
          <BackToLogin />
        </div>
      </section>
    );
  }

  return (
    <section className="auth-card" aria-labelledby="resetTitle">
      <h1 id="resetTitle">ตั้งรหัสผ่านใหม่</h1>
      <p className="lead">{RULE}</p>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {formError && (
          <div className="alert danger" role="alert">
            <TriangleAlert className="gg-icon sm" aria-hidden />
            <span>{formError}</span>
          </div>
        )}
        <div className="gg-field">
          <label className="gg-label" htmlFor="newPassword">
            รหัสผ่านใหม่<span className="gg-req" aria-hidden="true">*</span>
          </label>
          <div className={`gg-control${passwordError ? " invalid" : ""}`}>
            <span className="gg-lead"><Shield className="gg-icon sm" aria-hidden /></span>
            <input
              ref={passwordRef}
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="กรอกรหัสผ่านใหม่"
              required
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "newPasswordErr" : undefined}
              onInput={() => setPasswordError("")}
            />
            <button
              type="button"
              className={`eye${showPassword ? " on" : ""}`}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              aria-pressed={showPassword}
              onClick={() => {
                setShowPassword(!showPassword);
                passwordRef.current!.focus();
              }}
            >
              <Eye className="gg-icon sm" aria-hidden />
            </button>
          </div>
          {passwordError && <div className="gg-error" id="newPasswordErr">{passwordError}</div>}
        </div>
        <div className="gg-field">
          <label className="gg-label" htmlFor="confirmPassword">
            ยืนยันรหัสผ่าน<span className="gg-req" aria-hidden="true">*</span>
          </label>
          <div className={`gg-control${confirmError ? " invalid" : ""}`}>
            <span className="gg-lead"><Shield className="gg-icon sm" aria-hidden /></span>
            <input
              ref={confirmRef}
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              required
              aria-invalid={confirmError ? true : undefined}
              aria-describedby={confirmError ? "confirmPasswordErr" : undefined}
              onInput={() => setConfirmError("")}
            />
          </div>
          {confirmError && <div className="gg-error" id="confirmPasswordErr">{confirmError}</div>}
        </div>
        <button type="submit" className="gg-btn gg-btn-primary submit" disabled={submitting}>
          {submitting && <span className="spin" aria-hidden="true" />}
          ตั้งรหัสผ่านใหม่
        </button>
      </form>
    </section>
  );
}
