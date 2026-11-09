"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  title: ReactNode;
  /** The design's widths: sm 420px, default 560px, lg 800px. */
  size?: "sm" | "lg";
  /** Called on X, Cancel (via the footer), overlay click and Escape. Ignored while `busy`. */
  onClose: () => void;
  /** While saving: closing is blocked so a request can't be cut off half way. */
  busy?: boolean;
  /** Given → the dialog is a <form> (the design's create/edit modals); Enter submits. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Element to focus when the modal opens. Defaults to the first field or button. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  footer: ReactNode;
  children: ReactNode;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The design's .gg-scrim / .gg-modal dialog as a React component. Mount it to open it and
 * unmount it to close it; the parent owns the open state. It handles what every modal
 * needs: Escape, overlay click, the X button, focus (moved in on open, kept inside while
 * open, returned to the opener on close) and stopping the page behind from scrolling.
 */
export default function Modal({ title, size, onClose, busy = false, onSubmit, initialFocus, footer, children }: Props) {
  const titleId = useId();
  const dialog = useRef<HTMLElement>(null);
  // Latest values for the listeners below, which are attached once.
  const state = useRef({ onClose, busy });
  useEffect(() => {
    state.current = { onClose, busy };
  });

  const requestClose = () => {
    if (!state.current.busy) state.current.onClose();
  };

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const body = dialog.current?.querySelector(".gg-modal-body");
    const target = initialFocus?.current ?? body?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog.current;
    target?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "Tab" && dialog.current) {
        // Keep Tab inside the dialog.
        const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      // The opener may be gone (e.g. its row was deleted); then focus stays on the page.
      if (opener?.isConnected) opener.focus();
    };
    // Runs once per opening; the latest onClose/busy are read through `state`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on a click on the overlay only when the press also started there, so selecting
  // text in a field and releasing outside the dialog doesn't close it.
  const pressedOnScrim = useRef(false);

  const inner = (
    <>
      <div className="gg-modal-head">
        <h2 className="gg-modal-title" id={titleId}>{title}</h2>
        <button type="button" className="gg-btn gg-btn-ghost sm icon-only" aria-label="ปิด" onClick={requestClose} disabled={busy}>
          <X className="gg-icon" aria-hidden />
        </button>
      </div>
      <div className="gg-modal-body">{children}</div>
      <div className="gg-modal-foot">{footer}</div>
    </>
  );
  const common = {
    className: `gg-modal${size ? ` ${size}` : ""}`,
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": titleId,
    tabIndex: -1,
  } as const;

  return createPortal(
    <div
      className="gg-scrim"
      onMouseDown={(e) => (pressedOnScrim.current = e.target === e.currentTarget)}
      onClick={(e) => {
        if (pressedOnScrim.current && e.target === e.currentTarget) requestClose();
        pressedOnScrim.current = false;
      }}
    >
      {onSubmit ? (
        <form {...common} ref={dialog as React.RefObject<HTMLFormElement>} noValidate onSubmit={onSubmit} aria-busy={busy}>
          {inner}
        </form>
      ) : (
        <div {...common} ref={dialog as React.RefObject<HTMLDivElement>}>
          {inner}
        </div>
      )}
    </div>,
    document.body,
  );
}
