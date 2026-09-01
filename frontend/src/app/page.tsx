"use client";

import { useEffect, useState } from "react";
import AnalysisSections from "@/components/dashboard/AnalysisSections";
import ChatPanel from "@/components/dashboard/ChatPanel";
import DomainSummary from "@/components/dashboard/DomainSummary";
import ShopifySync from "@/components/dashboard/ShopifySync";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState(false);

  const loadSummary = () => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError(true));
  };

  useEffect(loadSummary, []);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Business Intelligence Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            One agent for Inventory, Marketing, Operations &amp; Finance
          </p>
        </div>
        <ShopifySync onSynced={loadSummary} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          {error ? (
            <p className="text-sm text-red-400">
              Could not reach the backend. Is the API running on port 8000?
            </p>
          ) : summary ? (
            <DomainSummary summary={summary} />
          ) : (
            <p className="text-sm text-slate-500">Loading dashboard…</p>
          )}
        </div>
        <ChatPanel />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-200">Detailed Analysis</h2>
        <AnalysisSections />
      </section>
    </div>
  );
}
