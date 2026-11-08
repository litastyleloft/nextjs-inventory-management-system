import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";

/** Heading for create/edit pages, with the design's back button. */
export function FormPageHead({ title, subtitle, backHref }: { title: string; subtitle: string; backHref: string }) {
  return (
    <div className="gg-pagehead">
      <div>
        <h1 className="gg-pagehead-title">{title}</h1>
        <p className="gg-pagehead-sub">{subtitle}</p>
      </div>
      <div className="gg-pagehead-actions">
        <Link className="gg-btn gg-btn-secondary" href={backHref}>
          <ChevronLeft className="gg-icon" aria-hidden />
          ย้อนกลับ
        </Link>
      </div>
    </div>
  );
}

/** Shown instead of a form when the user lacks the permission for it. */
export function NoPermission({ noun }: { noun: string }) {
  return (
    <div className="gg-card">
      <div className="gg-card-body form-denied">
        <span className="gg-stat-icon"><Lock className="gg-icon" aria-hidden /></span>
        <div>
          <b>คุณไม่มีสิทธิ์จัดการ{noun}</b>
          <div className="gg-hint">ติดต่อผู้ดูแลระบบหากต้องการเพิ่มหรือแก้ไข{noun}</div>
        </div>
      </div>
    </div>
  );
}
