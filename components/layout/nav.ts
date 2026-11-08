import {
  ArrowLeftRight,
  ChartColumn,
  CircleDollarSign,
  Diff,
  FileText,
  Globe,
  LayoutDashboard,
  Package,
  PanelsTopLeft,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { key: string; label: string; href: string };
export type NavItem = NavLink & { icon: LucideIcon; children?: NavLink[] };
export type NavEntry = NavItem | { section: string };

/**
 * Sidebar navigation: NAV from design/src/design-system/components/bundle.js
 * with the Thai labels from design/src/partials/shell_bottom.html.
 * Icons are the closest lucide-react equivalents of the design's ICONS set.
 */
export const NAV: NavEntry[] = [
  { key: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard, href: "/dashboard" },
  { section: "สินค้าคงคลัง" },
  {
    key: "products", label: "สินค้า", icon: Package, href: "/products",
    children: [
      { key: "products.list", label: "สินค้าทั้งหมด", href: "/products" },
      { key: "products.categories", label: "หมวดหมู่สินค้า", href: "/products/categories" },
      { key: "products.units", label: "หน่วยนับ", href: "/products/units" },
      { key: "products.base-units", label: "หน่วยพื้นฐาน", href: "/products/base-units" },
      { key: "products.barcode", label: "พิมพ์บาร์โค้ด", href: "/products/barcode" },
    ],
  },
  { key: "adjustments", label: "ปรับปรุงสต็อก", icon: Diff, href: "/adjustments" },
  { key: "transfers", label: "โอนย้ายสินค้า", icon: ArrowLeftRight, href: "/transfers" },
  { key: "warehouse", label: "คลังสินค้า", icon: Warehouse, href: "/warehouse" },
  { section: "ซื้อขาย" },
  { key: "quotations", label: "ใบเสนอราคา", icon: FileText, href: "/quotations" },
  {
    key: "purchases", label: "การซื้อ", icon: ShoppingCart, href: "/purchases",
    children: [
      { key: "purchases.list", label: "รายการซื้อ", href: "/purchases" },
      { key: "purchases.returns", label: "คืนสินค้าให้ผู้จำหน่าย", href: "/purchases/returns" },
    ],
  },
  {
    key: "sales", label: "การขาย", icon: Receipt, href: "/sales",
    children: [
      { key: "sales.list", label: "รายการขาย", href: "/sales" },
      { key: "sales.returns", label: "รับคืนสินค้า", href: "/sales/returns" },
      { key: "sales.billing-notes", label: "ใบวางบิล", href: "/sales/billing-notes" },
    ],
  },
  {
    key: "expenses", label: "ค่าใช้จ่าย", icon: Wallet, href: "/expenses",
    children: [
      { key: "expenses.list", label: "รายการค่าใช้จ่าย", href: "/expenses" },
      { key: "expenses.categories", label: "หมวดหมู่ค่าใช้จ่าย", href: "/expenses/categories" },
    ],
  },
  { section: "บุคคล" },
  {
    key: "people", label: "บุคคล", icon: Users, href: "/people/suppliers",
    children: [
      { key: "people.suppliers", label: "ผู้จำหน่าย", href: "/people/suppliers" },
      { key: "people.customers", label: "ลูกค้า", href: "/people/customers" },
      { key: "people.users", label: "ผู้ใช้งาน", href: "/people/users" },
    ],
  },
  { key: "roles", label: "บทบาทและสิทธิ์", icon: ShieldCheck, href: "/roles" },
  { section: "รายงานและการตั้งค่า" },
  { key: "reports", label: "รายงาน", icon: ChartColumn, href: "/reports" },
  { key: "currencies", label: "สกุลเงิน", icon: CircleDollarSign, href: "/currencies" },
  { key: "languages", label: "ภาษา", icon: Globe, href: "/languages" },
  {
    key: "templates", label: "เทมเพลต", icon: PanelsTopLeft, href: "/templates/email",
    children: [
      { key: "templates.email", label: "เทมเพลตอีเมล", href: "/templates/email" },
      { key: "templates.sms", label: "เทมเพลต SMS", href: "/templates/sms" },
    ],
  },
  { key: "settings", label: "ตั้งค่า", icon: SlidersHorizontal, href: "/settings" },
];

export const isSection = (e: NavEntry): e is { section: string } => "section" in e;

/**
 * Finds the nav entry for a pathname. The longest matching href wins, so
 * /products/categories resolves to "หมวดหมู่สินค้า" and /products/create
 * still resolves to "สินค้าทั้งหมด".
 */
export function findActive(pathname: string): { item: NavItem; link: NavLink } | null {
  let best: { item: NavItem; link: NavLink } | null = null;
  for (const item of NAV) {
    if (isSection(item)) continue;
    for (const link of item.children ?? [item]) {
      const hit = pathname === link.href || pathname.startsWith(link.href + "/");
      if (hit && (!best || link.href.length > best.link.href.length)) best = { item, link };
    }
  }
  return best;
}
