"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { listHref, PAGE_SIZES } from "@/lib/list";

export default function PageSizeSelect({ basePath, q, size }: { basePath: string; q: string; size: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="gg-control">
      <select
        aria-label="แถวต่อหน้า"
        value={size}
        onChange={(e) => {
          const next = Number(e.target.value);
          startTransition(() => router.replace(listHref(basePath, { q, size: next, page: 1 }), { scroll: false }));
        }}
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <span className="gg-caret"><ChevronDown className="gg-icon sm" aria-hidden /></span>
    </div>
  );
}
