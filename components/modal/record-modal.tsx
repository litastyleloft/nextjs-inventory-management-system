"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type OpenModal<T> = (record: T | null, opener?: HTMLElement | null) => void;

/**
 * One create/edit modal per list page, opened from anywhere inside it: the toolbar's
 * Create button (no record) or a row's Edit button (that row's record). The table is
 * rendered on the server; only the buttons and the modal are client code.
 *
 * Usage, per module (see app/(dashboard)/products/categories/CategoryModal.tsx):
 *   const { Provider, useOpenModal } = createRecordModal<CategoryRow>();
 *   <Provider render={(record, close) => <CategoryModal category={record} onClose={close} />}>…</Provider>
 *   const open = useOpenModal();  <button onClick={(e) => open(row, e.currentTarget)}>
 */
export function createRecordModal<T>() {
  const OpenContext = createContext<OpenModal<T> | null>(null);

  function Provider({ render, children }: { render: (record: T | null, close: () => void) => ReactNode; children: ReactNode }) {
    // `key` changes on every opening, so the form starts fresh each time.
    const [open, setOpen] = useState<{ record: T | null; key: number } | null>(null);
    // The button that opened the modal gets focus back when it closes. It is passed in
    // because a click doesn't focus a button in every browser (Safari).
    const opener = useRef<HTMLElement | null>(null);

    const openModal = useCallback<OpenModal<T>>((record, from) => {
      opener.current = from ?? (document.activeElement as HTMLElement | null);
      setOpen((o) => ({ record, key: (o?.key ?? 0) + 1 }));
    }, []);
    const close = useCallback(() => setOpen(null), []);

    useEffect(() => {
      if (open || !opener.current) return;
      // A row's button may have been re-rendered or removed by a refresh; skip if gone.
      if (opener.current.isConnected) opener.current.focus();
      opener.current = null;
    }, [open]);

    return (
      <OpenContext.Provider value={openModal}>
        {children}
        {open && <ModalSlot key={open.key}>{render(open.record, close)}</ModalSlot>}
      </OpenContext.Provider>
    );
  }

  function useOpenModal() {
    const open = useContext(OpenContext);
    if (!open) throw new Error("useOpenModal must be used inside its record modal Provider");
    return open;
  }

  return { Provider, useOpenModal };
}

function ModalSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
