import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { listHref, type ListFilters } from "@/lib/list";
import PageSizeSelect from "./PageSizeSelect";

function PagerLink({ href, label, disabled, children }: { href: string; label: string; disabled: boolean; children: ReactNode }) {
  if (disabled) return <span className="gg-page" aria-disabled="true" aria-label={label}>{children}</span>;
  return <Link className="gg-page" href={href} aria-label={label} scroll={false}>{children}</Link>;
}

/** Up to five page numbers around the current page. */
function pageWindow(page: number, pages: number) {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  return Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
}

/** The design's .gg-pager footer: rows per page, "1–10 จาก N", and page links. */
export default function ListPager({ basePath, q, size, page, pages, total, filters }: { basePath: string; q: string; size: number; page: number; pages: number; total: number; filters?: ListFilters }) {
  const href = (p: number) => listHref(basePath, { q, size, page: p }, filters);
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(total, page * size);

  return (
    <div className="gg-pager">
      <div className="gg-pager-size">
        แถวต่อหน้า
        <PageSizeSelect basePath={basePath} q={q} size={size} filters={filters} />
        <span className="gg-num" style={{ marginLeft: 8 }}>{`${from}–${to} จาก ${total}`}</span>
      </div>
      <nav className="gg-pager-pages" aria-label="เลขหน้า">
        <PagerLink href={href(1)} label="หน้าแรก" disabled={page <= 1}><ChevronsLeft className="gg-icon sm" aria-hidden /></PagerLink>
        <PagerLink href={href(page - 1)} label="หน้าก่อนหน้า" disabled={page <= 1}><ChevronLeft className="gg-icon sm" aria-hidden /></PagerLink>
        {pageWindow(page, pages).map((p) =>
          p === page ? (
            <span key={p} className="gg-page active" aria-current="page">{p}</span>
          ) : (
            <Link key={p} className="gg-page" href={href(p)} scroll={false}>{p}</Link>
          ),
        )}
        <PagerLink href={href(page + 1)} label="หน้าถัดไป" disabled={page >= pages}><ChevronRight className="gg-icon sm" aria-hidden /></PagerLink>
        <PagerLink href={href(pages)} label="หน้าสุดท้าย" disabled={page >= pages}><ChevronsRight className="gg-icon sm" aria-hidden /></PagerLink>
      </nav>
    </div>
  );
}
