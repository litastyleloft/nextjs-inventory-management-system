"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Trash2, X } from "lucide-react";

/** What every delete server action returns. */
export type DeleteRecordResult =
  | { status: "success"; name: string }
  | { status: "blocked"; message: string }
  | { status: "not-found" | "forbidden" | "signed-out" };

type Props = {
  id: string;
  name: string;
  /** Thai noun for messages, e.g. "คลังสินค้า". */
  noun: string;
  /** The delete server action. It re-checks permission, the record and whether it is in use. */
  action: (id: string) => Promise<DeleteRecordResult>;
};

/**
 * Row delete button with the design's confirmation modal (people-list.tpl.html #confirm).
 * Nothing is deleted until the user confirms; the server then re-checks everything.
 */
export default function DeleteRecordButton({ id, name, noun, action }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const toastId = `delete-${noun}`;

  function close() {
    if (deleting) return;
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // close only reads `deleting`, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deleting]);

  async function confirm() {
    setDeleting(true);
    try {
      const result = await action(id);
      if (result.status === "success") toast.success(`ลบ "${result.name}" แล้ว`, { id: toastId });
      else if (result.status === "blocked") toast.error(`ลบ "${name}" ไม่ได้: ${result.message}`, { id: toastId, duration: 6000 });
      else if (result.status === "not-found") toast.error(`ไม่พบ${noun}นี้ อาจถูกลบไปแล้ว`, { id: toastId });
      else if (result.status === "forbidden") toast.error(`คุณไม่มีสิทธิ์จัดการ${noun}`, { id: toastId });
      else toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: toastId });
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", { id: toastId });
    }
    setDeleting(false);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="gg-btn gg-btn-ghost danger sm icon-only"
        aria-label={`ลบ ${name}`}
        title="ลบ"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="gg-icon sm" aria-hidden />
      </button>
      {open &&
        createPortal(
          <div className="gg-scrim" onMouseDown={(e) => e.target === e.currentTarget && close()}>
            <div className="gg-modal sm" role="dialog" aria-modal="true" aria-labelledby={`del-${id}-title`} aria-describedby={`del-${id}-text`}>
              <div className="gg-modal-head">
                <h2 className="gg-modal-title" id={`del-${id}-title`}>ลบ{noun} &ldquo;{name}&rdquo; ใช่หรือไม่?</h2>
                <button type="button" className="gg-btn gg-btn-ghost sm icon-only" aria-label="ปิด" onClick={close} disabled={deleting}>
                  <X className="gg-icon" aria-hidden />
                </button>
              </div>
              <div className="gg-modal-body">
                <div className="gg-modal-confirm">
                  <div className="gg-stat-icon"><Trash2 className="gg-icon" aria-hidden /></div>
                  <div id={`del-${id}-text`} style={{ color: "var(--ink-2)", whiteSpace: "normal", textAlign: "left" }}>
                    ข้อมูลของ{noun}นี้จะถูกลบออกจากรายการ การลบนี้ไม่สามารถย้อนกลับได้
                  </div>
                </div>
              </div>
              <div className="gg-modal-foot">
                <button ref={cancel} type="button" className="gg-btn gg-btn-secondary" onClick={close} disabled={deleting}>
                  ยกเลิก
                </button>
                <button type="button" className="gg-btn gg-btn-danger" onClick={confirm} disabled={deleting} aria-busy={deleting}>
                  <Trash2 className="gg-icon sm" aria-hidden />
                  {deleting ? "กำลังลบ…" : `ลบ${noun}`}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
