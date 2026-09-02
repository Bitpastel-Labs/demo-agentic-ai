"use client";

import { useCallback, useEffect, useState } from "react";
import AnalysisSections from "@/components/dashboard/AnalysisSections";
import ChatPanel from "@/components/dashboard/ChatPanel";
import DomainSummary from "@/components/dashboard/DomainSummary";
import PriorityActions from "@/components/dashboard/PriorityActions";
import ShopifySync from "@/components/dashboard/ShopifySync";
import Sidebar from "@/components/dashboard/Sidebar";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";

const today = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState(false);
  // Bumped after a Shopify sync so every section refetches.
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSummary = useCallback(() => {
    getDashboardSummary()
      .then((s) => {
        setSummary(s);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(loadSummary, [loadSummary, refreshKey]);

  const handleSynced = () => setRefreshKey((k) => k + 1);

  const shopName = summary?.meta.shop_name;

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="flex items-center gap-2.5 border-b border-sidebar-line bg-sidebar px-5 py-3 lg:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-brand font-display text-xs font-semibold text-white">
          BI
        </span>
        <span className="font-display text-sm font-semibold text-white">Business Intelligence</span>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
          <header id="overview" className="mb-8 flex flex-wrap items-start justify-between gap-4 scroll-mt-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">Overview</p>
              <h1 className="font-display mt-1 text-[26px] font-semibold leading-tight text-ink">
                {shopName ? `${shopName}, at a glance` : "The whole store, at a glance"}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">{today}</p>
            </div>
            <ShopifySync onSynced={handleSynced} />
          </header>

          {error ? (
            <div className="rounded-xl border border-bad/30 bg-bad-soft p-4 text-sm text-bad">
              The dashboard can&apos;t reach the backend. Start it on port 8000, then reload this page.
            </div>
          ) : summary ? (
            <DomainSummary summary={summary} />
          ) : (
            <p className="text-sm text-ink-soft">Loading dashboard…</p>
          )}

          {!error && (
            <div className="mt-12">
              <PriorityActions refreshKey={refreshKey} />
            </div>
          )}

          <section className="mt-12" aria-label="Detailed analysis">
            <h2 className="font-display mb-1 text-lg font-semibold text-ink">Detailed analysis</h2>
            <p className="mb-4 text-sm text-ink-soft">Open a section to inspect the underlying records.</p>
            <AnalysisSections refreshKey={refreshKey} health={summary?.health ?? null} />
          </section>

          <footer className="mt-12 border-t border-line pt-5 text-xs text-ink-faint">
            Business Intelligence — one agent for inventory, marketing, operations and finance
            {summary?.meta.last_synced_at ? `, synced from ${shopName ?? "Shopify"}.` : "."}
          </footer>
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
