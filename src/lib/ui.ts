export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export function stars(n: number): string {
  const full = Math.round(n);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

export function money(cents: number | null | undefined, currency = "USD"): string {
  if (cents == null) return currency === "USD" ? "$0" : `0 ${currency}`;
  const v = cents / 100;
  const s = v % 1 === 0 ? String(v) : v.toFixed(2);
  return currency === "USD" ? `$${s}` : `${s} ${currency}`;
}

export function fmtDate(d: string | null | undefined, lang: "ar" | "en" = "ar"): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(lang === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `c-${Date.now()}`;
}
