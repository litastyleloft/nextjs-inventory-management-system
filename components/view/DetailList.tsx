import type { ReactNode } from "react";

export type DetailItem = { label: string; value: ReactNode };

/** Shown for an empty value, so every row reads the same. */
export const NotSet = () => <span className="none" title="ยังไม่ได้กำหนด">—</span>;

/**
 * A titled block of label/value rows for read-only "view" pages (the panel style of the
 * design's sale details page). Empty values (null, undefined, "") show a dash.
 */
export default function DetailList({ title, items, className }: { title: string; items: DetailItem[]; className?: string }) {
  return (
    <section className={className} aria-label={title}>
      <h2 className="panel-h">{title}</h2>
      <dl className="info">
        {items.map((item) => (
          <div key={item.label} style={{ display: "contents" }}>
            <dt>{item.label}</dt>
            <dd>{item.value === null || item.value === undefined || item.value === "" ? <NotSet /> : item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
