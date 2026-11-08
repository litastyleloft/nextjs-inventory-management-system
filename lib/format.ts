// Thai date and time as the design shows them (GG.thDate / GG.thTime), fixed to Bangkok
// time so the output never depends on the server's time zone.
const dateFormat = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const timeFormat = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

export const thaiDate = (d: Date) => dateFormat.format(d);
export const thaiTime = (d: Date) => `${timeFormat.format(d)} น.`;

// First letter for an avatar, skipping Thai leading vowels (เ แ โ ใ ไ).
const firstLetter = (s: string) => s.replace(/^[เ-ไ]/, "").charAt(0);

/** Two-letter avatar initials, ported from the design's people-data.js `initials`. */
export function initials(name: string) {
  const parts = name.replace(/^(บริษัท|ห้างหุ้นส่วน|ร้าน)\s*/, "").trim().split(/\s+/);
  const second = parts[1] ? firstLetter(parts[1]) : firstLetter((parts[0] ?? "").replace(/^[เ-ไ]/, "").slice(1));
  return (firstLetter(parts[0] ?? "") + second).toUpperCase();
}
