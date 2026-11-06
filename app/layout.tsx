import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans_Thai, Public_Sans } from "next/font/google";
import "./gildedglow.css";

// The fonts named in design/src/design-system/tokens.json (type.families).
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"] });
const publicSans = Public_Sans({ subsets: ["latin"], style: ["normal", "italic"] });
const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { template: "%s · LTS Solution", default: "LTS Solution" },
};

// The design pages are laid out for a fixed 1440px canvas.
export const viewport: Viewport = { width: 1440 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  // next/font serves fonts under generated family names, so re-point the
  // --font-display / --font-sans tokens at them, keeping the token's order.
  const fontVars = {
    "--font-display": `${bricolage.style.fontFamily}, ${plexThai.style.fontFamily}, ${publicSans.style.fontFamily}, system-ui, sans-serif`,
    "--font-sans": `${publicSans.style.fontFamily}, ${plexThai.style.fontFamily}, system-ui, -apple-system, "Segoe UI", sans-serif`,
    // For canvas text (Chart.js), which the design sets to IBM Plex Sans Thai by name.
    "--font-thai": plexThai.style.fontFamily,
  } as CSSProperties;

  return (
    <html lang="th" data-theme="light" style={fontVars}>
      <body>{children}</body>
    </html>
  );
}
