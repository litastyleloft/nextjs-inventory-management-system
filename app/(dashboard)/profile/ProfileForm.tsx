"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Check, Lock, Pencil, RotateCcw, User } from "lucide-react";

import { updateProfile, type ProfileData, type ProfileField } from "./actions";

const MAX_PHOTO_BYTES = 1024 * 1024;

type Errors = Partial<Record<ProfileField, string>>;

function validate(values: ProfileData): Errors {
  const errors: Errors = {};
  if (!values.firstName.trim()) errors.firstName = "กรุณากรอกชื่อ";
  if (!values.lastName.trim()) errors.lastName = "กรุณากรอกนามสกุล";
  const phone = (values.phoneNumber ?? "").trim();
  if (phone && !(/^[+0-9][0-9\s\-()]*$/.test(phone) && phone.replace(/\D/g, "").length >= 9)) {
    errors.phoneNumber = "เบอร์โทรต้องมีตัวเลขอย่างน้อย 9 หลัก";
  }
  return errors;
}

type TextField = {
  id: Exclude<ProfileField, "photo"> | "email";
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  autoComplete: string;
  readOnly?: string; // the hint shown under a locked field
};

const FIELDS: TextField[] = [
  { id: "firstName", label: "ชื่อ", type: "text", placeholder: "กรอกชื่อ", required: true, autoComplete: "given-name" },
  { id: "lastName", label: "นามสกุล", type: "text", placeholder: "กรอกนามสกุล", required: true, autoComplete: "family-name" },
  // The email is the sign-in name, so it is not editable here. Like role, it has no name
  // attribute and is never sent, and the server action never updates it.
  { id: "email", label: "อีเมล", type: "email", placeholder: "", required: false, autoComplete: "email", readOnly: "อีเมลใช้สำหรับเข้าสู่ระบบ ติดต่อผู้ดูแลระบบหากต้องการเปลี่ยน" },
  { id: "phoneNumber", label: "เบอร์โทรศัพท์", type: "tel", placeholder: "เช่น 081-234-5678", required: false, autoComplete: "tel" },
];

export default function ProfileForm({ profile, roleName }: { profile: ProfileData; roleName: string }) {
  const [saved, setSaved] = useState(profile);
  const [values, setValues] = useState(profile);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<ProfileField, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "danger"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Release the preview's object URL when it is replaced or the page closes.
  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const shownImage = photoPreview ?? (removePhoto ? null : saved.image);
  const initials = (values.firstName.trim().charAt(0) + values.lastName.trim().charAt(0)).toUpperCase();
  const dirty =
    photoFile !== null ||
    removePhoto ||
    FIELDS.some(({ id, readOnly }) => !readOnly && (values[id] ?? "").trim() !== (saved[id] ?? ""));
  const liveErrors = { ...validate(values), photo: errors.photo };
  const visibleError = (id: ProfileField) => (touched[id] || errors[id] ? errors[id] ?? liveErrors[id] : undefined);
  const problemCount = Object.values(validate(values)).filter(Boolean).length;

  function update(id: TextField["id"], value: string) {
    setValues((v) => ({ ...v, [id]: value }));
    setErrors((e) => ({ ...e, [id]: undefined }));
    setMessage(null);
  }

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setErrors((e) => ({ ...e, photo: "รองรับเฉพาะไฟล์ JPG หรือ PNG" }));
    } else if (file.size > MAX_PHOTO_BYTES) {
      setErrors((e) => ({ ...e, photo: "ไฟล์ใหญ่เกิน 1 MB" }));
    } else {
      setErrors((e) => ({ ...e, photo: undefined }));
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(Boolean(saved.image));
    setErrors((e) => ({ ...e, photo: undefined }));
    setMessage(null);
  }

  function resetForm() {
    setValues(saved);
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(false);
    setErrors({});
    setTouched({});
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ firstName: true, lastName: true, phoneNumber: true });
    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    const formData = new FormData();
    for (const { id, readOnly } of FIELDS) if (!readOnly) formData.set(id, (values[id] ?? "").trim());
    if (photoFile) formData.set("photo", photoFile);
    if (removePhoto) formData.set("removePhoto", "1");

    setSaving(true);
    setMessage(null);
    try {
      const result = await updateProfile(formData);
      if (result.status === "success") {
        const next = { ...result.profile, phoneNumber: result.profile.phoneNumber ?? "" };
        setSaved(next);
        setValues(next);
        setPhotoFile(null);
        setPhotoPreview(null);
        setRemovePhoto(false);
        setErrors({});
        setTouched({});
        setMessage({ kind: "success", text: "บันทึกโปรไฟล์แล้ว" });
      } else if (result.status === "invalid") {
        setErrors(result.errors);
      } else {
        setMessage({ kind: "danger", text: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
      }
    } catch {
      setMessage({ kind: "danger", text: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
    }
    setSaving(false);
  }

  return (
    <form className="gg-card" noValidate onSubmit={handleSubmit}>
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
                  <button type="button" className="gg-btn gg-btn-ghost sm" onClick={clearPhoto}>
                    ลบรูป
                  </button>
                )}
                {errors.photo && <div className="gg-error" role="alert">{errors.photo}</div>}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              id="photoFile"
              accept="image/png,image/jpeg"
              hidden
              onChange={(e) => choosePhoto(e.target.files?.[0])}
            />
          </div>

          {FIELDS.map((field) => {
            if (field.readOnly) {
              return (
                <div className="gg-field" key={field.id}>
                  <label className="gg-label" htmlFor={field.id}>{field.label}</label>
                  <div className="gg-control is-readonly">
                    <input id={field.id} type={field.type} value={saved[field.id] ?? ""} disabled readOnly aria-describedby={`${field.id}Hint`} />
                    <span className="gg-trail"><Lock className="gg-icon sm" aria-hidden /></span>
                  </div>
                  <div className="gg-hint" id={`${field.id}Hint`}>{field.readOnly}</div>
                </div>
              );
            }
            const id = field.id as Exclude<ProfileField, "photo">;
            const error = visibleError(id);
            return (
              <div className="gg-field" key={field.id}>
                <label className="gg-label" htmlFor={field.id}>
                  {field.label}
                  {field.required ? (
                    <span className="gg-req" aria-hidden="true">*</span>
                  ) : (
                    <span className="optional">(ไม่บังคับ)</span>
                  )}
                </label>
                <div className={`gg-control${error ? " invalid" : ""}`}>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    value={values[field.id] ?? ""}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${field.id}Err` : undefined}
                    onChange={(e) => update(field.id, e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
                  />
                </div>
                {error && <div className="gg-error" id={`${field.id}Err`}>{error}</div>}
              </div>
            );
          })}

          {/*
            SECURITY: role is shown read-only and has no name attribute, so it is never
            submitted, and the server action ignores any role value anyway. Users must not
            be able to change their own role (anyone could make themselves admin).
            Role changes belong on the admin Users page.
          */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="role">บทบาท</label>
            <div className="gg-control is-readonly">
              <input id="role" type="text" value={roleName} disabled readOnly aria-describedby="roleHint" />
              <span className="gg-trail"><Lock className="gg-icon sm" aria-hidden /></span>
            </div>
            <div className="gg-hint role-note" id="roleHint">คุณไม่สามารถเปลี่ยนบทบาทของตัวเองได้</div>
          </div>
        </div>
      </div>
      <div className="gg-card-foot">
        {message?.kind === "success" && !dirty ? (
          <span className="form-ok show gg-badge success" role="status">
            <Check className="gg-icon sm" aria-hidden />
            {message.text}
          </span>
        ) : message?.kind === "danger" ? (
          <span className="form-ok show gg-badge danger" role="alert">
            <span className="gg-badge-dot" />
            {message.text}
          </span>
        ) : (
          <span className="foot-note">
            {!dirty
              ? "ยังไม่มีการเปลี่ยนแปลง"
              : problemCount
                ? `กรอกช่องที่มีเครื่องหมาย * ให้ถูกต้องเพื่อบันทึก (เหลือ ${problemCount} ช่อง)`
                : "พร้อมบันทึก"}
          </span>
        )}
        <button type="button" className="gg-btn gg-btn-secondary" onClick={resetForm} disabled={!dirty || saving}>
          <RotateCcw className="gg-icon sm" aria-hidden />
          ยกเลิก
        </button>
        <button type="submit" className="gg-btn gg-btn-primary" disabled={!dirty || saving || problemCount > 0}>
          {saving ? <span className="spin" aria-hidden="true" /> : <Check className="gg-icon sm" aria-hidden />}
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
