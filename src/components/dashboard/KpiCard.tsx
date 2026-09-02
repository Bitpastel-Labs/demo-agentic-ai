interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "good" | "warn" | "bad";
  size?: "md" | "sm";
}

const accentClass = {
  default: "text-ink",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
};

export default function KpiCard({ label, value, sub, accent = "default", size = "md" }: KpiCardProps) {
  const small = size === "sm";
  return (
    <div
      className={`rounded-lg border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${small ? "p-3" : "p-4"}`}
    >
      <p className={`font-semibold uppercase tracking-wider text-ink-faint ${small ? "text-[10px]" : "text-[11px]"}`}>
        {label}
      </p>
      <p
        className={`tabular font-semibold leading-tight ${accentClass[accent]} ${small ? "mt-1 text-lg" : "mt-1.5 text-[22px]"}`}
      >
        {value}
      </p>
      {sub && <p className={`mt-1 text-ink-soft ${small ? "text-[11px]" : "text-xs"}`}>{sub}</p>}
    </div>
  );
}
