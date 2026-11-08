"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ChevronLeft, TriangleAlert, User } from "lucide-react";

import { requestPasswordReset } from "./actions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = emailRef.current!.value.trim();
    const nextError = !email ? "กรุณากรอกอีเมล" : EMAIL_PATTERN.test(email) ? "" : "รูปแบบอีเมลไม่ถูกต้อง";
    setEmailError(nextError);
    setFormError("");
    if (nextError) {
      emailRef.current!.focus();
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email);
    } catch {
      setFormError("ไม่สามารถส่งคำขอได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    }
    setSubmitting(false);
  }

  return (
    <section className="auth-card" aria-labelledby="forgotTitle">
      <h1 id="forgotTitle">ลืมรหัสผ่าน</h1>
      <p className="lead">กรอกอีเมลที่ใช้เข้าสู่ระบบ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้</p>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {formError && (
          <div className="alert danger" role="alert">
            <TriangleAlert className="gg-icon sm" aria-hidden />
            <span>{formError}</span>
          </div>
        )}
        {sentTo ? (
          // The same answer whether or not the account exists.
          <div className="alert success" role="status">
            <Check className="gg-icon sm" aria-hidden />
            <span>ถ้า {sentTo} เป็นบัญชีในระบบ คุณจะได้รับอีเมลพร้อมลิงก์ตั้งรหัสผ่านใหม่ภายในไม่กี่นาที ลิงก์ใช้ได้ 30 นาที</span>
          </div>
        ) : (
          <>
            <div className="gg-field">
              <label className="gg-label" htmlFor="forgotEmail">
                อีเมล<span className="gg-req" aria-hidden="true">*</span>
              </label>
              <div className={`gg-control${emailError ? " invalid" : ""}`}>
                <span className="gg-lead"><User className="gg-icon sm" aria-hidden /></span>
                <input
                  ref={emailRef}
                  id="forgotEmail"
                  type="email"
                  autoComplete="username"
                  placeholder="กรอกอีเมล"
                  required
                  defaultValue={initialEmail}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? "forgotEmailErr" : undefined}
                  onInput={() => setEmailError("")}
                />
              </div>
              {emailError && <div className="gg-error" id="forgotEmailErr">{emailError}</div>}
            </div>
            <button type="submit" className="gg-btn gg-btn-primary submit" disabled={submitting}>
              {submitting && <span className="spin" aria-hidden="true" />}
              ส่งลิงก์ตั้งรหัสผ่านใหม่
            </button>
          </>
        )}
        <button type="button" className="link back" onClick={onBack}>
          <ChevronLeft className="gg-icon sm" aria-hidden />
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </form>
    </section>
  );
}
