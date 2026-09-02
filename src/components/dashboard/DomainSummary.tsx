import KpiCard from "./KpiCard";
import { domainColor } from "@/lib/domains";
import type { DashboardSummary } from "@/lib/api";

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function SectionHeader({ name, color, anchor }: { name: string; color: string; anchor: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        {name}
      </h2>
      <a href={`#${anchor}`} className="text-xs font-medium text-brand hover:text-brand-strong hover:underline">
        View analysis
      </a>
    </div>
  );
}

export default function DomainSummary({ summary }: { summary: DashboardSummary }) {
  const { inventory, marketing, operations, finance } = summary;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <section aria-label="Inventory summary">
        <SectionHeader name="Inventory" color={domainColor.inventory} anchor="inventory-analysis" />
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Total SKUs" value={String(inventory.total_skus)} />
          <KpiCard label="Units in Stock" value={inventory.total_units.toLocaleString()} />
          <KpiCard label="Stock Value" value={money(inventory.stock_value)} />
          <KpiCard
            label="Low Stock"
            value={String(inventory.low_stock_count)}
            accent={inventory.low_stock_count > 0 ? "warn" : "good"}
            sub="items at or below reorder level"
          />
        </div>
      </section>

      <section aria-label="Marketing summary">
        <SectionHeader name="Marketing" color={domainColor.marketing} anchor="marketing-analysis" />
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Active Campaigns" value={String(marketing.active_campaigns)} />
          <KpiCard label="Ad Spend" value={money(marketing.total_spend)} />
          <KpiCard label="Ad Revenue" value={money(marketing.total_revenue)} />
          <KpiCard label="ROAS" value={`${marketing.roas}x`} accent={marketing.roas >= 2 ? "good" : "warn"} />
        </div>
      </section>

      <section aria-label="Operations summary">
        <SectionHeader name="Operations" color={domainColor.operations} anchor="operations-analysis" />
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Total Orders" value={String(operations.total_orders)} />
          <KpiCard
            label="Awaiting Fulfillment"
            value={String(operations.pending_orders)}
            accent={operations.pending_orders > 0 ? "warn" : "good"}
          />
          <KpiCard label="Open Tasks" value={String(operations.open_tasks)} />
          <KpiCard
            label="High Priority"
            value={String(operations.high_priority_tasks)}
            accent={operations.high_priority_tasks > 0 ? "bad" : "good"}
          />
        </div>
      </section>

      <section aria-label="Finance summary">
        <SectionHeader name="Finance" color={domainColor.finance} anchor="finance-analysis" />
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Revenue" value={money(finance.total_revenue)} />
          <KpiCard label="Expenses" value={money(finance.total_expenses)} />
          <KpiCard
            label="Net Profit"
            value={money(finance.net_profit)}
            accent={finance.net_profit >= 0 ? "good" : "bad"}
          />
          <KpiCard label="Margin" value={`${finance.profit_margin_pct}%`} />
        </div>
      </section>
    </div>
  );
}
