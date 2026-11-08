"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Check, Eye, Shield, TriangleAlert, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import ForgotPasswordForm from "./ForgotPasswordForm";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMEMBER_KEY = "lts-remember-email";

const MESSAGES = {
  emailRequired: "กรุณากรอกอีเมล",
  emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
  passwordRequired: "กรุณากรอกรหัสผ่าน",
  // One message for a wrong email or password, so the form never reveals which accounts exist.
  badCredentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  unavailable: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
};

function validateEmail(email: string) {
  if (!email) return MESSAGES.emailRequired;
  return EMAIL_PATTERN.test(email) ? "" : MESSAGES.emailInvalid;
}

// Storage can be blocked (private windows, site settings). Remembering the email is
// only a convenience, so sign-in must keep working when it throws.
function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY);
  } catch {
    return null;
  }
}

function writeRememberedEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {}
}

function SignedOutNotice() {
  const params = useSearchParams();
  const message = params.get("pw") === "changed"
    ? "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่"
    : params.get("out")
      ? "ออกจากระบบเรียบร้อยแล้ว"
      : null;
  if (!message) return null;
  return (
    <div className="alert info" role="status">
      <Check className="gg-icon sm" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export default function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  // The email to pre-fill while the forgot-password card is open; null shows sign-in.
  const [forgotEmail, setForgotEmail] = useState<string | null>(null);

  useEffect(() => {
    const saved = readRememberedEmail();
    if (saved) {
      emailRef.current!.value = saved;
      rememberRef.current!.checked = true;
    }
  }, []);

  useEffect(() => {
    if (forgotEmail !== null) return;
    (emailRef.current!.value ? passwordRef : emailRef).current!.focus();
  }, [forgotEmail]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = emailRef.current!.value.trim();
    const password = passwordRef.current!.value;
    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? "" : MESSAGES.passwordRequired;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      (nextEmailError ? emailRef : passwordRef).current!.focus();
      return;
    }

    setFormError("");
    setSubmitting(true);

    let failure = MESSAGES.unavailable;
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok && !result.error) {
        writeRememberedEmail(rememberRef.current!.checked ? email : null);
        // Full navigation on purpose: with cacheComponents, a client-side navigation keeps
        // this route mounted but hidden (<Activity>), along with the typed password.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/dashboard");
        return;
      }
      if (result?.error === "CredentialsSignin") failure = MESSAGES.badCredentials;
    } catch {
      // Network failure: falls through with the "unavailable" message.
    }

    setSubmitting(false);
    setFormError(failure);
    passwordRef.current!.value = "";
    passwordRef.current!.focus();
  }

  function handleCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  return (
    <>
    {forgotEmail !== null && <ForgotPasswordForm initialEmail={forgotEmail} onBack={() => setForgotEmail(null)} />}
    {/* Stays mounted while hidden so the typed email and remember choice survive. */}
    <section className="auth-card" aria-labelledby="signinTitle" hidden={forgotEmail !== null}>
      <h1 id="signinTitle">เข้าสู่ระบบ</h1>
      <p className="lead">ใช้อีเมลและรหัสผ่านที่ผู้ดูแลระบบสร้างให้</p>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {formError ? (
          <div className="alert danger" role="alert">
            <TriangleAlert className="gg-icon sm" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : (
          <Suspense fallback={null}>
            <SignedOutNotice />
          </Suspense>
        )}

        <div className="gg-field">
          <label className="gg-label" htmlFor="email">
            อีเมล<span className="gg-req" aria-hidden="true">*</span>
          </label>
          <div className={`gg-control${emailError ? " invalid" : ""}`}>
            <span className="gg-lead"><User className="gg-icon sm" aria-hidden /></span>
            <input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="username"
              placeholder="กรอกอีเมล"
              required
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "emailErr" : undefined}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value) setEmailError(validateEmail(value));
              }}
              onInput={(e) => {
                setFormError("");
                if (emailError) setEmailError(validateEmail(e.currentTarget.value.trim()));
              }}
            />
          </div>
          {emailError && <div className="gg-error" id="emailErr">{emailError}</div>}
        </div>

        <div className="gg-field">
          <div className="label-row">
            <label className="gg-label" htmlFor="password">
              รหัสผ่าน<span className="gg-req" aria-hidden="true">*</span>
            </label>
            <button type="button" className="link" onClick={() => setForgotEmail(emailRef.current!.value.trim())}>
              ลืมรหัสผ่าน?
            </button>
          </div>
          <div className={`gg-control${passwordError ? " invalid" : ""}`}>
            <span className="gg-lead"><Shield className="gg-icon sm" aria-hidden /></span>
            <input
              ref={passwordRef}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              required
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "passwordErr" : undefined}
              onKeyDown={handleCapsLock}
              onKeyUp={handleCapsLock}
              onBlur={() => setCapsLock(false)}
              onInput={() => {
                setFormError("");
                setPasswordError("");
              }}
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
          {capsLock && (
            <div className="caps">
              <TriangleAlert className="gg-icon sm" aria-hidden />
              Caps Lock เปิดอยู่
            </div>
          )}
          {passwordError && <div className="gg-error" id="passwordErr">{passwordError}</div>}
        </div>

        <label className="remember">
          <input ref={rememberRef} type="checkbox" />
          จดจำอีเมลบนเครื่องนี้
        </label>

        <button type="submit" className="gg-btn gg-btn-primary submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spin" aria-hidden="true" />
              กำลังเข้าสู่ระบบ…
            </>
          ) : (
            "เข้าสู่ระบบ"
          )}
        </button>
      </form>
    </section>
    </>
  );
}
