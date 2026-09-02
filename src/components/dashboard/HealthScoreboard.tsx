"use client";

import { DOMAINS, domainColor, type DomainKey } from "@/lib/domains";
import type { HealthScore, HealthStatus } from "@/lib/api";

const statusStyle: Record<HealthStatus, { text: string; soft: string; bar: string; label: string }> = {
  healthy: { text: "text-good", soft: "bg-good-soft", bar: "bg-good", label: "Healthy" },
  watch: { text: "text-warn", soft: "bg-warn-soft", bar: "bg-warn", label: "Watch" },
  at_risk: { text: "text-bad", soft: "bg-bad-soft", bar: "bg-bad", label: "At risk" },
};

function ScoreRing({ score, status, size = 88 }: { score: number; status: HealthStatus; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = status === "healthy" ? "#067647" : status === "watch" ? "#b54708" : "#b42318";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Overall score ${score} of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4e7ec" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="tabular" fontSize={size * 0.3} fontWeight={600} fill="#101828">
        {score}
      </text>
    </svg>
  );
}

function DomainBar({ domain, health, showComponents }: { domain: DomainKey; health: HealthScore["domains"][DomainKey]; showComponents: boolean }) {
  const meta = DOMAINS.find((d) => d.key === domain)!;
  const s = statusStyle[health.status];
  return (
    <li className="py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: domainColor[domain] }} aria-hidden />
        <span className="font-medium text-ink">{meta.label}</span>
        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.soft} ${s.text}`}>
          {health.grade}
        </span>
        <span className={`tabular w-8 text-right font-semibold ${s.text}`}>{health.score}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
        <div className={`h-full rounded-full ${s.bar} transition-[width] duration-500`} style={{ width: `${health.score}%` }} />
      </div>
      {showComponents && (
        <ul className="mt-2 space-y-1">
          {health.components.map((c) => (
            <li key={c.label} className="flex items-baseline gap-2 text-xs">
              <span className="tabular w-8 shrink-0 text-right font-medium text-ink">{c.score}</span>
              <span className="text-ink">{c.label}</span>
              <span className="text-ink-faint">· {Math.round(c.weight * 100)}%</span>
              <span className="ml-auto truncate text-right text-ink-soft" title={c.detail}>
                {c.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface HealthScoreboardProps {
  health: HealthScore;
  /** Show the weighted components under each domain. */
  detailed?: boolean;
  className?: string;
}

export default function HealthScoreboard({ health, detailed = false, className = "" }: HealthScoreboardProps) {
  const s = statusStyle[health.overall.status];
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>
      <div className="flex items-center gap-4">
        <ScoreRing score={health.overall.score} status={health.overall.status} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Business health</p>
          <p className={`font-display text-xl font-semibold leading-tight ${s.text}`}>
            {s.label} <span className="text-ink-faint">·</span> Grade {health.overall.grade}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Average of the four domain scores. 80+ is healthy, 60–79 needs watching, below 60 is at risk.
          </p>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-line/70">
        {DOMAINS.map((d) => (
          <DomainBar key={d.key} domain={d.key} health={health.domains[d.key]} showComponents={detailed} />
        ))}
      </ul>
    </div>
  );
}
