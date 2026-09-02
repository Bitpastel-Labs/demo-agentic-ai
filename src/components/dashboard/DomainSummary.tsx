"use client";

import HealthScoreboard from "./HealthScoreboard";
import KpiCard from "./KpiCard";
import { domainColor } from "@/lib/domains";
import { openAnalysis } from "@/lib/analysisNav";
import { money, moneyCompact, pct } from "@/lib/format";
import type { DashboardSummary } from "@/lib/api";

function SectionHeader({ name, color, anchor, note }: { name: string; color: string; anchor: string; note?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        {name}
        {note && <span className="truncate text-xs font-normal text-ink-faint">· {note}</span>}
      </h2>
      <a
        href={`#${anchor}`}
        onClick={() => openAnalysis(anchor)}
        className="shrink-0 text-xs font-medium text-brand hover:text-brand-strong hover:underline"
      >
        View analysis
      </a>
    </div>
  );
}

export default function DomainSummary({ summary }: { summary: DashboardSummary }) {
  const { inventory, marketing, operations, finance, health, meta } = summary;
  const cur = meta.currency;
  const derived = marketing.campaign_source === "order_attribution";

  return (
    <div className="space-y-6">
      <section aria-label="Inventory summary">
        <SectionHeader name="Inventory" color={domainColor.inventory} anchor="inventory-analysis" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            size="sm"
            label="Stock Value (cost)"
            value={moneyCompact(inventory.stock_value, cur)}
            sub={
              inventory.missing_cost_count
                ? `${inventory.missing_cost_count} SKU(s) missing unit cost · retail ${moneyCompact(inventory.retail_value, cur)}`
                : `retail value ${moneyCompact(inventory.retail_value, cur)}`
            }
            accent={inventory.missing_cost_count ? "warn" : "default"}
          />
          <KpiCard
            size="sm"
            label="Low / Out of Stock"
            value={`${inventory.low_stock_count} / ${inventory.out_of_stock_count}`}
            accent={inventory.out_of_stock_count > 0 ? "bad" : inventory.low_stock_count > 0 ? "warn" : "good"}
            sub="at or below reorder level / at zero"
          />
          <KpiCard size="sm" label="Units in Stock" value={inventory.total_units.toLocaleString()} />
          <KpiCard size="sm" label="Active SKUs" value={String(inventory.total_skus)} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section aria-label="Finance summary">
          <SectionHeader name="Finance" color={domainColor.finance} anchor="finance-analysis" />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard size="sm" label="Revenue" value={moneyCompact(finance.total_revenue, cur)} sub={`net sales ${moneyCompact(finance.net_sales, cur)}`} />
            <KpiCard size="sm" label="Expenses" value={moneyCompact(finance.total_expenses, cur)} sub={`cost of goods ${moneyCompact(finance.cogs, cur)}`} />
            <KpiCard
              size="sm"
              label="Net Profit"
              value={moneyCompact(finance.net_profit, cur)}
              accent={finance.net_profit >= 0 ? "good" : "bad"}
            />
            <KpiCard
              size="sm"
              label="Net Margin"
              value={pct(finance.profit_margin_pct)}
              sub={`gross ${pct(finance.gross_margin_pct)}`}
              accent={finance.profit_margin_pct >= 15 ? "good" : finance.profit_margin_pct >= 0 ? "warn" : "bad"}
            />
          </div>
        </section>

        <section aria-label="Marketing summary">
          <SectionHeader
            name="Marketing"
            color={domainColor.marketing}
            anchor="marketing-analysis"
            note={derived ? "from order attribution" : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              size="sm"
              label="Active Channels"
              value={`${marketing.active_campaigns} / ${marketing.total_campaigns}`}
              sub="produced an order in 30 days"
              accent={marketing.total_campaigns && !marketing.active_campaigns ? "warn" : "default"}
            />
            <KpiCard
              size="sm"
              label={derived ? "Attributed Orders" : "Ad Spend"}
              value={derived ? String(marketing.total_conversions) : moneyCompact(marketing.total_spend, cur)}
              sub={derived ? `${pct(marketing.attribution_rate_pct, 0)} carry a UTM or code` : undefined}
            />
            <KpiCard size="sm" label="Attributed Revenue" value={moneyCompact(marketing.total_revenue, cur)} />
            <KpiCard
              size="sm"
              label="ROAS"
              value={marketing.roas === null ? "n/a" : `${marketing.roas}x`}
              sub={marketing.roas === null ? "no ad spend in Shopify" : undefined}
              accent={marketing.roas === null ? "default" : marketing.roas >= 2 ? "good" : "warn"}
            />
          </div>
        </section>

        <section aria-label="Operations summary">
          <SectionHeader name="Operations" color={domainColor.operations} anchor="operations-analysis" />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard size="sm" label="Total Orders" value={String(operations.total_orders)} sub={`${operations.orders_last_30d} in the last 30 days`} />
            <KpiCard
              size="sm"
              label="Awaiting Fulfilment"
              value={String(operations.pending_orders)}
              sub={operations.pending_orders ? money(operations.pending_value, cur) : `${pct(operations.fulfillment_rate_pct, 0)} fulfilled`}
              accent={operations.pending_orders > 0 ? "warn" : "good"}
            />
            <KpiCard size="sm" label="Open Tasks" value={String(operations.open_tasks)} sub={operations.overdue_tasks ? `${operations.overdue_tasks} overdue` : undefined} accent={operations.overdue_tasks ? "bad" : "default"} />
            <KpiCard
              size="sm"
              label="High Priority"
              value={String(operations.high_priority_tasks)}
              accent={operations.high_priority_tasks > 0 ? "bad" : "good"}
            />
          </div>
        </section>
      </div>

      <section aria-label="Business health scoreboard" id="health-scoreboard" className="scroll-mt-24">
        <SectionHeader name="Operations · Business health scoreboard" color={domainColor.operations} anchor="operations-analysis" />
        <HealthScoreboard health={health} />
      </section>
    </div>
  );
}
