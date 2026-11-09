"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Filter } from "lucide-react";

import ListSearch from "@/components/list/ListSearch";
import { listHref } from "@/lib/list";
import type { ProductFilters } from "@/lib/products";

type Props = {
  basePath: string;
  q: string;
  size: number;
  filters: ProductFilters;
  categories: { id: string; code: string; name: string }[];
  /** Export, Import and Create (rendered on the server). */
  actions: ReactNode;
};

/**
 * The design's toolbar (search, Filter, Export, Import, Create) and its filter panel
 * (category, stock level). Filters live in the URL, so the server does the filtering and
 * paging; the panel starts open when a filter is set (e.g. from a category's product count).
 */
export default function ProductToolbar({ basePath, q, size, filters, categories, actions }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const active = Boolean(filters.category || filters.stock);
  const [open, setOpen] = useState(active);

  const go = (next: ProductFilters) =>
    startTransition(() => router.replace(listHref(basePath, { q, size, page: 1 }, next), { scroll: false }));

  return (
    <>
      <div className="gg-table-toolbar">
        <ListSearch basePath={basePath} q={q} size={size} filters={filters} placeholder="ค้นหาด้วยชื่อผ้า รหัส หรือส่วนประกอบ" label="ค้นหาสินค้า" />
        <div className="gg-row">
          <button
            type="button"
            className={`gg-btn gg-btn-secondary${open ? " on" : ""}`}
            aria-expanded={open}
            aria-controls="product-filters"
            onClick={() => setOpen(!open)}
          >
            <Filter className="gg-icon" aria-hidden />
            ตัวกรอง{active && <span className="filter-dot" aria-label="(มีตัวกรอง)" />}
          </button>
          {actions}
        </div>
      </div>
      <div className="filters" id="product-filters" hidden={!open}>
        <div className="gg-field">
          <label className="gg-label" htmlFor="fCat">หมวดหมู่</label>
          <div className="gg-control">
            <select id="fCat" value={filters.category} onChange={(e) => go({ ...filters, category: e.target.value })}>
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
              ))}
            </select>
            <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
          </div>
        </div>
        <div className="gg-field">
          <label className="gg-label" htmlFor="fStock">สต็อก</label>
          <div className="gg-control">
            <select id="fStock" value={filters.stock} onChange={(e) => go({ ...filters, stock: e.target.value as ProductFilters["stock"] })}>
              <option value="">ทุกระดับสต็อก</option>
              <option value="in-stock">มีสินค้า</option>
              <option value="low-stock">สินค้าใกล้หมด</option>
              <option value="out-of-stock">สินค้าหมด</option>
            </select>
            <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
          </div>
        </div>
        <button type="button" className="gg-btn gg-btn-ghost" disabled={!active} onClick={() => go({ category: "", stock: "" })}>
          ล้างตัวกรอง
        </button>
      </div>
    </>
  );
}
