import { z } from "zod";

/** Shared by every list page (warehouses, suppliers, …): URL params, page sizes and links. */

export const PAGE_SIZES = [10, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

export type ListSearchParams = Promise<Record<string, string | string[] | undefined>>;
export type ListParams = { q: string; page: number; size: PageSize };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Anything invalid in the URL falls back to a default instead of erroring.
const paramsSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1),
  size: z.coerce
    .number()
    .refine((n): n is PageSize => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(DEFAULT_PAGE_SIZE),
});

export function parseListParams(raw: Record<string, string | string[] | undefined>): ListParams {
  return paramsSchema.parse({
    q: first(raw.q) ?? "",
    page: first(raw.page) ?? 1,
    size: first(raw.size) ?? DEFAULT_PAGE_SIZE,
  });
}

/** Builds a list URL, leaving out values that are already the defaults. */
export function listHref(basePath: string, { q, page, size }: { q: string; page: number; size: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (size !== DEFAULT_PAGE_SIZE) params.set("size", String(size));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Clamps the page and works out the slice for a list query. */
export function paginate(total: number, page: number, size: number) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  return { pages, page: current, skip: (current - 1) * size, take: size };
}
