"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, ChevronDown, Eye, EyeOff, Pencil, User } from "lucide-react";

import { passwordStrength } from "@/lib/password-policy";
import { EMPTY_USER, userErrors, type UserErrors, type UserField, type UserFormMode, type UserInput } from "@/lib/validation/user";
import type { UserActionResult } from "./actions";

const MAX_PHOTO_BYTES = 1024 * 1024;
const LIST_PATH = "/people/users";

/** First letter for an avatar, skipping Thai leading vowels (design: D.ch). */
const firstLetter = (s: string) => s.trim().replace(/^[เ-ไ]/, "").charAt(0);

type Role = { id: string; name: string; description: string | null };

type Props = {
  mode: UserFormMode;
  roles: Role[];
  /** Saved values for edit mode. Never contains a password: both password fields start empty. */
  initial?: Omit<UserInput, "password" | "confirmPassword">;
  initialImage?: string | null;
  /** Editing your own account: the role can't be changed (the server ignores it too). */
  roleLocked?: boolean;
  action: (formData: FormData) => Promise<UserActionResult>;
};

type TextField = { id: Exclude<UserField, "photo" | "role">; label: string; placeholder: string; type?: string; required: boolean; autoComplete: string };

/**
 * design/html/lts-create-user.html (people-form template, users config): photo, first and
 * last name, email, phone, password + confirmation with the strength meter, and role.
 * Not built on RecordForm because it uploads a photo and handles passwords.
 */
export default function UserForm({ mode, roles, initial, initialImage = null, roleLocked = false, action }: Props) {
  const router = useRouter();
  const start: UserInput = { ...EMPTY_USER, ...initial, password: "", confirmPassword: "" };
  const [values, setValues] = useState<UserInput>(start);
  const [touched, setTouched] = useState<Partial<Record<UserField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<UserErrors>({});
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({ password: false, confirmPassword: false });
  const savedImage = initialImage;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const clientErrors = userErrors(mode, values);
  const errorFor = (id: UserField) => serverErrors[id] ?? (touched[id] ? clientErrors[id] : undefined);
  const problemCount = Object.keys(clientErrors).length + (serverErrors.photo ? 1 : 0);
  const shownImage = photoPreview ?? (removePhoto ? null : savedImage);
  const initials = (firstLetter(values.firstName) + firstLetter(values.lastName)).toUpperCase();
  const strength = passwordStrength(values.password);
  const selectedRole = roles.find((r) => r.id === values.role);

  function change(id: Exclude<UserField, "photo">, value: string) {
    setValues((v) => ({ ...v, [id]: value }));
    setServerErrors((s) => ({ ...s, [id]: undefined }));
  }

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) setServerErrors((e) => ({ ...e, photo: "รองรับเฉพาะไฟล์ JPG หรือ PNG" }));
    else if (file.size > MAX_PHOTO_BYTES) setServerErrors((e) => ({ ...e, photo: "ไฟล์ใหญ่เกิน 1 MB" }));
    else {
      setServerErrors((e) => ({ ...e, photo: undefined }));
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(Boolean(savedImage));
    setServerErrors((e) => ({ ...e, photo: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, phoneNumber: true, role: true, password: true, confirmPassword: true });
    if (Object.keys(clientErrors).length) return;

    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) formData.set(key, key.endsWith("assword") ? value : value.trim());
    if (photoFile) formData.set("photo", photoFile);
    if (removePhoto) formData.set("removePhoto", "1");

    setSaving(true);
    try {
      const result = await action(formData);
      if (result.status === "success") {
        toast.success(`บันทึก "${result.name}" แล้ว`, { id: "user-form" });
        // Clear passwords (and, for create, everything) before leaving: with cacheComponents
        // this page stays mounted while hidden.
        setValues(mode === "create" ? EMPTY_USER : (v) => ({ ...v, password: "", confirmPassword: "" }));
        setTouched({});
        setPhotoFile(null);
        setPhotoPreview(null);
        router.push(LIST_PATH);
        return;
      }
      if (result.status === "invalid") {
        setServerErrors(result.errors);
        toast.error("กรุณาตรวจสอบข้อมูลที่กรอก", { id: "user-form" });
      } else if (result.status === "not-found") {
        toast.error("ไม่พบผู้ใช้งานนี้ อาจถูกลบไปแล้ว", { id: "user-form" });
        router.push(LIST_PATH);
        return;
      } else if (result.status === "forbidden") {
        toast.error("คุณไม่มีสิทธิ์จัดการผู้ใช้งาน", { id: "user-form" });
      } else {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: "user-form" });
      }
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: "user-form" });
    }
    setSaving(false);
  }

  function label(id: string, text: string, required: boolean) {
    return (
      <label className="gg-label" htmlFor={id}>
        {text}
        {required ? <span className="gg-req" aria-hidden="true">*</span> : <span className="optional">(ไม่บังคับ)</span>}
      </label>
    );
  }

  function errorLine(id: UserField, fallbackHint?: React.ReactNode) {
    const error = errorFor(id);
    if (error) return <div className="gg-error" id={`${id}Err`}>{error}</div>;
    return fallbackHint ?? null;
  }

  const passwordRequired = mode === "create";
  const textFields: TextField[] = [
    { id: "firstName", label: "ชื่อ", placeholder: "กรอกชื่อ", required: true, autoComplete: "off" },
    { id: "lastName", label: "นามสกุล", placeholder: "กรอกนามสกุล", required: true, autoComplete: "off" },
    { id: "email", label: "อีเมล", placeholder: "กรอกอีเมล", type: "email", required: true, autoComplete: "off" },
    { id: "phoneNumber", label: "เบอร์โทรศัพท์", placeholder: "เช่น 081-234-5678", type: "tel", required: false, autoComplete: "off" },
  ];

  return (
    <form className="gg-card" noValidate autoComplete="off" onSubmit={handleSubmit}>
      <div className="gg-card-body" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        <div className="pf-grid">
          <div className="gg-field full">
            <span className="gg-label">รูปโปรไฟล์</span>
            <div className="photo">
              <div className="photo-box">
                <div className="photo-img">
                  {shownImage ? (
                    <Image src={shownImage} alt="รูปโปรไฟล์" width={96} height={96} unoptimized />
                  ) : initials ? (
                    initials
                  ) : (
                    <User className="gg-icon" aria-hidden />
                  )}
                </div>
                <label className="photo-edit" htmlFor="photoFile" title="เปลี่ยนรูป">
                  <Pencil className="gg-icon sm" aria-hidden />
                  <span className="gg-sr">เปลี่ยนรูปโปรไฟล์</span>
                </label>
              </div>
              <div className="photo-meta">
                JPG หรือ PNG ไม่เกิน 1 MB
                <br />
                รูปสี่เหลี่ยมจัตุรัสจะแสดงผลได้ดีที่สุด
                <br />
                {shownImage && (
                  <button type="button" className="gg-btn gg-btn-ghost sm" onClick={clearPhoto}>ลบรูป</button>
                )}
                {serverErrors.photo && <div className="gg-error" role="alert">{serverErrors.photo}</div>}
              </div>
            </div>
            <input ref={fileRef} type="file" id="photoFile" accept="image/png,image/jpeg" hidden onChange={(e) => choosePhoto(e.target.files?.[0])} />
          </div>

          {textFields.map((f, index) => {
            const error = errorFor(f.id);
            return (
              <div className="gg-field" key={f.id}>
                {label(f.id, f.label, f.required)}
                <div className={`gg-control${error ? " invalid" : ""}`}>
                  <input
                    id={f.id}
                    name={f.id}
                    type={f.type ?? "text"}
                    autoComplete={f.autoComplete}
                    autoFocus={index === 0}
                    placeholder={f.placeholder}
                    value={values[f.id]}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${f.id}Err` : undefined}
                    onChange={(e) => change(f.id, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value.trim() || f.required) setTouched((t) => ({ ...t, [f.id]: true }));
                    }}
                  />
                </div>
                {errorLine(f.id)}
              </div>
            );
          })}

          {(["password", "confirmPassword"] as const).map((id) => {
            const error = errorFor(id);
            const isMain = id === "password";
            return (
              <div className="gg-field" key={id}>
                {label(id, isMain ? "รหัสผ่าน" : "ยืนยันรหัสผ่าน", passwordRequired)}
                <div className={`gg-control${error ? " invalid" : ""}`}>
                  {/* Never pre-filled: the existing password is never sent to the browser. */}
                  <input
                    id={id}
                    name={id}
                    type={show[id] ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={isMain ? (mode === "edit" ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข") : "กรอกรหัสผ่านอีกครั้ง"}
                    value={values[id]}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}Err` : isMain ? "passwordHint" : undefined}
                    onChange={(e) => change(id, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value || passwordRequired) setTouched((t) => ({ ...t, [id]: true }));
                    }}
                  />
                  <button
                    type="button"
                    className={`eye${show[id] ? " on" : ""}`}
                    aria-label={show[id] ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    aria-pressed={show[id]}
                    onClick={() => setShow((s) => ({ ...s, [id]: !s[id] }))}
                  >
                    {show[id] ? <EyeOff className="gg-icon sm" aria-hidden /> : <Eye className="gg-icon sm" aria-hidden />}
                  </button>
                </div>
                {isMain && (
                  <div className={`meter s${strength}`} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {errorLine(
                  id,
                  isMain && (
                    <div className="gg-hint" id="passwordHint">
                      {/* The design's hints for create and edit. */}
                      {mode === "edit" ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : "อย่างน้อย 8 ตัว มีทั้งตัวอักษรและตัวเลข"}
                    </div>
                  ),
                )}
              </div>
            );
          })}

          <div className="gg-field">
            {label("role", "บทบาท", true)}
            <div className={`gg-control${errorFor("role") ? " invalid" : ""}`}>
              {/* Options come from the Role table in the database. */}
              <select
                id="role"
                name="role"
                disabled={roleLocked}
                value={values.role}
                className={values.role === "" ? "is-placeholder" : undefined}
                aria-invalid={errorFor("role") ? true : undefined}
                onChange={(e) => {
                  change("role", e.target.value);
                  setTouched((t) => ({ ...t, role: true }));
                }}
              >
                <option value="" disabled>เลือกบทบาท</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
            </div>
            {errorLine(
              "role",
              <div className="gg-hint role-note">
                {/* The design's wording when editing yourself. */}
                {roleLocked ? "คุณไม่สามารถเปลี่ยนบทบาทของตัวเองได้" : (selectedRole?.description ?? "กำหนดเมนูที่ผู้ใช้เข้าถึงได้")}
              </div>,
            )}
          </div>
        </div>
      </div>
      <div className="gg-card-foot">
        <span className="foot-note">
          {problemCount ? `กรอกช่องที่มีเครื่องหมาย * ให้ถูกต้องเพื่อบันทึก (เหลือ ${problemCount} ช่อง)` : "พร้อมบันทึก"}
        </span>
        <Link className="gg-btn gg-btn-secondary" href={LIST_PATH}>ยกเลิก</Link>
        <button type="submit" className="gg-btn gg-btn-primary" disabled={saving || problemCount > 0}>
          {saving ? <span className="spin" aria-hidden="true" /> : <Check className="gg-icon" aria-hidden />}
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
