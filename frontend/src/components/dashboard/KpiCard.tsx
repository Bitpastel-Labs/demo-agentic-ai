interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "good" | "warn" | "bad";
}

const accentClass = {
  default: "text-ink",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
};

export default function KpiCard({ label, value, sub, accent = "default" }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`tabular mt-1.5 text-[22px] font-semibold leading-tight ${accentClass[accent]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
