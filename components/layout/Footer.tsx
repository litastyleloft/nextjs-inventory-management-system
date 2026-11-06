import Link from "next/link";

// Year is a constant (as in the design) rather than new Date(): with
// cacheComponents on, reading the clock in a prerendered server component errors.
const YEAR = 2026;

/** The footer from design/src/partials/shell_bottom.html. */
export default function Footer() {
  return (
    <footer className="gg-shell-foot">
      <span>
        © {YEAR} <Link href="/dashboard">LTS Solution</Link> สงวนลิขสิทธิ์
      </span>
      <span>ค้าส่งผ้า · ระบบสินค้าคงคลังและ POS</span>
    </footer>
  );
}
