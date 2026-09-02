"use client";

import { useEffect, useState } from "react";
import { DOMAINS, domainColor, type DomainKey } from "@/lib/domains";
import { openAnalysis } from "@/lib/analysisNav";
import { getPriorityActions, type PriorityAction, type PriorityActions as PriorityActionsData, type Severity } from "@/lib/api";

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

const severityStyle: Record<Severity, { badge: string; dot: string; label: string }> = {
  critical: { badge: "bg-bad text-white", dot: "bg-bad", label: "Critical" },
  high: { badge: "bg-bad-soft text-bad", dot: "bg-bad", label: "High" },
  medium: { badge: "bg-warn-soft text-warn", dot: "bg-warn", label: "Medium" },
  low: { badge: "bg-ground text-ink-soft", dot: "bg-ink-faint", label: "Low" },
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = severityStyle[severity];
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.badge}`}>
      {s.label}
    </span>
  );
}

function ActionCard({ action }: { action: PriorityAction }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-2.5 text-left" aria-expanded={open}>
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityStyle[action.severity].dot}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-ink">{action.title}</span>
          <span className="mt-0.5 block text-xs text-ink-soft tabular">{action.metric}</span>
        </span>
        <SeverityBadge severity={action.severity} />
      </button>
      {open && (
        <div className="mt-2.5 space-y-1.5 border-t border-line/70 pt-2.5 text-xs">
          <p className="text-ink-soft">{action.detail}</p>
          <p className="text-ink">
            <span className="font-semibold">Next step:</span> {action.next_step}
          </p>
        </div>
      )}
    </li>
  );
}

function DomainColumn({ domain, actions }: { domain: DomainKey; actions: PriorityAction[] }) {
  const meta = DOMAINS.find((d) => d.key === domain)!;
  const urgent = actions.filter((a) => a.severity === "critical" || a.severity === "high").length;
  return (
    <section
      aria-label={`${meta.label} priority actions`}
      className="flex flex-col rounded-xl border border-line bg-ground/50 p-3"
    >
      <header className="mb-2.5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: domainColor[domain] }} aria-hidden />
          {meta.label}
        </h3>
        <span className={`text-xs font-medium ${urgent ? "text-bad" : "text-ink-soft"}`}>
          {actions.length === 0 ? "All clear" : urgent ? `${urgent} urgent` : `${actions.length} to review`}
        </span>
      </header>
      {actions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-ink-faint">
          Nothing needs attention right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((a, i) => (
            <ActionCard key={`${a.title}-${i}`} action={a} />
          ))}
        </ul>
      )}
      <a
        href={`#${domain}-analysis`}
        onClick={() => openAnalysis(`${domain}-analysis`)}
        className="mt-3 text-xs font-medium text-brand hover:text-brand-strong hover:underline"
      >
        Open {meta.label.toLowerCase()} analysis
      </a>
    </section>
  );
}

export default function PriorityActions({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<PriorityActionsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPriorityActions()
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, [refreshKey]);

  return (
    <section id="priority-actions" className="scroll-mt-24" aria-label="Priority actions">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Priority actions</h2>
          <p className="text-sm text-ink-soft">
            What the intelligence agent would do first in each domain, ranked by urgency.
          </p>
        </div>
        {data && (
          <ul className="flex flex-wrap gap-2" aria-label="Actions by severity">
            {SEVERITY_ORDER.map((sev) => (
              <li key={sev} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${severityStyle[sev].badge}`}>
                <span className="tabular">{data.counts[sev]}</span> {severityStyle[sev].label.toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="rounded-xl border border-bad/30 bg-bad-soft p-4 text-sm text-bad">Priority actions couldn&apos;t be loaded.</p>
      ) : !data ? (
        <p className="text-sm text-ink-soft">Working out what needs attention…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {DOMAINS.map((d) => (
            <DomainColumn key={d.key} domain={d.key} actions={data.by_domain[d.key] ?? []} />
          ))}
        </div>
      )}
    </section>
  );
}
