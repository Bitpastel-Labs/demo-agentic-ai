/** Money and date formatting in the connected store's currency. */

export function money(amount: number | null | undefined, currency = "USD", digits = 2): string {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
      minimumFractionDigits: Number.isInteger(amount) && digits === 0 ? 0 : Math.min(2, digits),
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: digits })} ${currency}`;
  }
}

/** Compact money for KPI tiles: ₹1.73M, $12.4k. */
export function moneyCompact(amount: number | null | undefined, currency = "USD"): string {
  if (amount === null || amount === undefined) return "—";
  if (Math.abs(amount) < 10000) return money(amount, currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return money(amount, currency, 0);
  }
}

export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(digits)}%`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return iso;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return shortDate(iso);
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
