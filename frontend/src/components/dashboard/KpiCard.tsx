interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "good" | "warn" | "bad";
}

const accentClass = {
  default: "text-slate-100",
  good: "text-emerald-400",
  warn: "text-amber-400",
  bad: "text-red-400",
};

export default function KpiCard({ label, value, sub, accent = "default" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentClass[accent]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
