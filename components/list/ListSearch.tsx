"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { DEFAULT_PAGE_SIZE, listHref, type ListFilters } from "@/lib/list";

/**
 * Toolbar search for a list page. Without JavaScript it is a plain GET form (Enter
 * submits); with JavaScript it updates the URL as you type, which re-runs the server query.
 */
export default function ListSearch({ basePath, q, size, placeholder, label, filters = {} }: { basePath: string; q: string; size: number; placeholder: string; label: string; filters?: ListFilters }) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function go(next: string) {
    clearTimeout(timer.current);
    startTransition(() => router.replace(listHref(basePath, { q: next.trim(), size, page: 1 }, filters), { scroll: false }));
  }

  return (
    <form
      role="search"
      action={basePath}
      className="list-search"
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
    >
      {size !== DEFAULT_PAGE_SIZE && <input type="hidden" name="size" value={size} />}
      {Object.entries(filters).map(([key, value]) => value && <input key={key} type="hidden" name={key} value={value} />)}
      <div className="gg-control">
        <span className="gg-lead"><Search className="gg-icon sm" aria-hidden /></span>
        <input
          name="q"
          type="search"
          value={value}
          maxLength={100}
          placeholder={placeholder}
          aria-label={label}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => go(next), 300);
          }}
        />
        {value && (
          <button
            type="button"
            className="list-search-clear"
            aria-label="ล้างการค้นหา"
            onClick={() => {
              setValue("");
              go("");
            }}
          >
            <X className="gg-icon sm" aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}
