"use client";

import { useEffect, useRef, useState } from "react";
import Accordion from "./Accordion";
import HealthScoreboard from "./HealthScoreboard";
import { domainColor, type DomainKey } from "@/lib/domains";
import { money, pct, shortDate, titleCase } from "@/lib/format";
import {
  getAnalysis,
  type FinanceAnalysis,
  type HealthScore,
  type InventoryAnalysis,
  type MarketingAnalysis,
  type OperationsAnalysis,
} from "@/lib/api";

const badge = (text: string, tone: "green" | "amber" | "red" | "slate") => {
  const tones = {
    green: "bg-good-soft text-good",
    amber: "bg-warn-soft text-warn",
    red: "bg-bad-soft text-bad",
    slate: "bg-ground text-ink-soft",
  };
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{text}</span>;
};

/** Load a domain's detail the first time its accordion opens; refetch after a sync. */
function useLazyLoad<T>(domain: DomainKey, refreshKey: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const loadedRef = useRef(false);
  const load = () => {
    loadedRef.current = true;
    setError(false);
    getAnalysis<T>(domain)
      .then(setData)
      .catch(() => setError(true));
  };
  useEffect(() => {
    if (loadedRef.current && refreshKey > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  return { data, error, load };
}

function LoadingOrError({ error }: { error: boolean }) {
  return (
    <p className="text-sm text-ink-soft">{error ? "Details couldn't be loaded. Reopen to retry." : "Loading…"}</p>
  );
}

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint";
const td = "px-3 py-2 text-sm text-ink";
const tdNum = `${td} tabular whitespace-nowrap`;

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-lg bg-ground/70 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`tabular mt-0.5 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

const PAGE = 25;

function InventoryDetails({ refreshKey }: { refreshKey: number }) {
  const { data, error, load } = useLazyLoad<InventoryAnalysis>("inventory", refreshKey);
  const [filter, setFilter] = useState<"all" | "attention" | "active">("attention");
  const [shown, setShown] = useState(PAGE);
  const cur = data?.currency ?? "USD";

  const rows = (data?.products ?? []).filter((p) =>
    filter === "all" ? true : filter === "active" ? p.status === "active" : p.status === "active" && p.low_stock,
  );

  return (
    <Accordion title="Inventory Analysis" color={domainColor.inventory} id="inventory-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Active SKUs" value={`${data.total_skus} (${data.total_products} products)`} />
            <Stat label="Units" value={data.total_units.toLocaleString()} />
            <Stat label="Stock value (cost)" value={money(data.stock_value, cur)} tone={data.missing_cost_count ? "warn" : undefined} />
            <Stat label="Retail value" value={money(data.retail_value, cur)} />
            <Stat label="Low / out of stock" value={`${data.low_stock_count} / ${data.out_of_stock_count}`} tone={data.out_of_stock_count ? "bad" : data.low_stock_count ? "warn" : "good"} />
            <Stat label="Missing unit cost" value={String(data.missing_cost_count)} tone={data.missing_cost_count ? "warn" : "good"} />
          </div>

          {data.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {data.categories.slice(0, 8).map((c) => (
                <span key={c.category} className="rounded-full border border-line px-2.5 py-1 text-ink-soft">
                  <span className="font-medium text-ink">{c.category}</span> · {c.skus} SKUs · {c.units.toLocaleString()} units
                  {c.low_stock ? <span className="text-warn"> · {c.low_stock} low</span> : null}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(
              [
                ["attention", `Needs attention (${data.low_stock_count})`],
                ["active", `Active (${data.total_skus})`],
                ["all", `All incl. drafts (${data.products.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setShown(PAGE);
                }}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  filter === key ? "bg-brand text-white" : "border border-line text-ink-soft hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>SKU</th>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={th}>Vendor</th>
                  <th className={th}>Price</th>
                  <th className={th}>Cost</th>
                  <th className={th}>Stock</th>
                  <th className={th}>Reorder</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td className={`${td} text-ink-soft`} colSpan={9}>
                      Nothing to show for this filter.
                    </td>
                  </tr>
                )}
                {rows.slice(0, shown).map((p) => (
                  <tr key={p.sku} className="border-b border-line/60 last:border-0">
                    <td className={tdNum}>{p.sku}</td>
                    <td className={td}>{p.name}</td>
                    <td className={td}>{p.category}</td>
                    <td className={td}>{p.vendor ?? "—"}</td>
                    <td className={tdNum}>{money(p.price, cur)}</td>
                    <td className={`${tdNum} ${p.cost === null ? "text-ink-faint" : ""}`}>{p.cost === null ? "not set" : money(p.cost, cur)}</td>
                    <td className={tdNum}>{p.stock_qty}</td>
                    <td className={tdNum}>{p.reorder_level}</td>
                    <td className={td}>
                      {p.status !== "active"
                        ? badge(titleCase(p.status), "slate")
                        : p.out_of_stock
                          ? badge("Out of stock", "red")
                          : p.low_stock
                            ? badge("Low stock", "amber")
                            : badge("In stock", "green")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > shown && (
              <button onClick={() => setShown((n) => n + PAGE)} className="mt-3 text-xs font-medium text-brand hover:underline">
                Show {Math.min(PAGE, rows.length - shown)} more of {rows.length}
              </button>
            )}
          </div>
        </div>
      )}
    </Accordion>
  );
}

function MarketingDetails({ refreshKey }: { refreshKey: number }) {
  const { data, error, load } = useLazyLoad<MarketingAnalysis>("marketing", refreshKey);
  const cur = data?.currency ?? "USD";
  const derived = data?.campaign_source === "order_attribution";
  return (
    <Accordion title="Marketing Analysis" color={domainColor.marketing} id="marketing-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Channels active" value={`${data.active_campaigns} / ${data.total_campaigns}`} />
            <Stat label="Attributed orders" value={String(data.total_conversions)} />
            <Stat label="Attributed revenue" value={money(data.total_revenue, cur)} />
            <Stat label="Avg order value" value={money(data.avg_order_value, cur)} />
            <Stat label="Ad spend" value={data.total_spend ? money(data.total_spend, cur) : "n/a"} />
            <Stat label="ROAS / CTR" value={`${data.roas === null ? "n/a" : `${data.roas}x`} / ${data.ctr_pct === null ? "n/a" : pct(data.ctr_pct)}`} />
          </div>
          {derived && (
            <p className="rounded-lg border border-line bg-ground/60 px-3 py-2 text-xs text-ink-soft">
              Campaigns are derived from Shopify order attribution (UTM campaign, discount code, then sales channel).{" "}
              {pct(data.attribution_rate_pct, 0)} of orders carry a UTM tag or code. Ad spend, impressions and clicks are not
              available from Shopify orders; grant <code className="rounded bg-surface px-1">read_marketing_events</code> to
              pull first-party campaigns.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Campaign / channel</th>
                  <th className={th}>Platform</th>
                  <th className={th}>Status</th>
                  <th className={th}>Orders</th>
                  <th className={th}>Revenue</th>
                  <th className={th}>Spend / Budget</th>
                  <th className={th}>ROAS</th>
                  <th className={th}>Last order</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.name} className="border-b border-line/60 last:border-0">
                    <td className={td}>
                      {c.name}
                      {c.attribution && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-ink-faint">{titleCase(c.attribution)}</span>}
                    </td>
                    <td className={td}>{c.platform}</td>
                    <td className={td}>{c.status === "active" ? badge("Active", "green") : badge(titleCase(c.status), "slate")}</td>
                    <td className={tdNum}>{c.conversions}</td>
                    <td className={tdNum}>{money(c.revenue, cur)}</td>
                    <td className={tdNum}>{c.spend || c.budget ? `${money(c.spend, cur)} / ${money(c.budget, cur)}` : "—"}</td>
                    <td className={tdNum}>{c.roas === null ? "—" : `${c.roas}x`}</td>
                    <td className={tdNum}>{shortDate(c.last_order_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Accordion>
  );
}

function OperationsDetails({ refreshKey, health }: { refreshKey: number; health: HealthScore | null }) {
  const { data, error, load } = useLazyLoad<OperationsAnalysis>("operations", refreshKey);
  const cur = data?.currency ?? "USD";
  return (
    <Accordion title="Operations Analysis" color={domainColor.operations} id="operations-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Orders" value={String(data.total_orders)} />
            <Stat label="Awaiting fulfilment" value={`${data.pending_orders} · ${money(data.pending_value, cur)}`} tone={data.pending_orders ? "warn" : "good"} />
            <Stat label="Fulfilment rate" value={pct(data.fulfillment_rate_pct, 0)} tone={data.fulfillment_rate_pct >= 90 ? "good" : "warn"} />
            <Stat label="Cancellation rate" value={pct(data.cancellation_rate_pct)} tone={data.cancellation_rate_pct > 10 ? "bad" : undefined} />
            <Stat label="Last 30 days" value={`${data.orders_last_30d} orders · ${money(data.revenue_last_30d, cur)}`} />
            <Stat label="Avg order value" value={money(data.avg_order_value, cur)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <h3 className="mb-2 text-sm font-semibold text-ink">
                  Recent orders{" "}
                  <span className="font-normal text-ink-soft">
                    ({Object.entries(data.orders_by_channel)
                      .map(([ch, n]) => `${n} ${titleCase(ch).toLowerCase()}`)
                      .join(", ")})
                  </span>
                </h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={th}>Order</th>
                      <th className={th}>Date</th>
                      <th className={th}>Customer</th>
                      <th className={th}>Items</th>
                      <th className={th}>Total</th>
                      <th className={th}>Payment</th>
                      <th className={th}>Fulfilment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_orders.map((o) => (
                      <tr key={o.order_number} className="border-b border-line/60 last:border-0">
                        <td className={tdNum}>{o.order_number}</td>
                        <td className={tdNum}>{shortDate(o.created_at)}</td>
                        <td className={td}>{o.customer_name}</td>
                        <td className={tdNum}>{o.items}</td>
                        <td className={tdNum}>{money(o.total, cur)}</td>
                        <td className={td}>
                          {o.financial_status === "paid"
                            ? badge("Paid", "green")
                            : o.financial_status
                              ? badge(titleCase(o.financial_status), o.financial_status.includes("refund") ? "slate" : "amber")
                              : "—"}
                        </td>
                        <td className={td}>
                          {o.status === "fulfilled"
                            ? badge("Fulfilled", "green")
                            : o.status === "cancelled"
                              ? badge("Cancelled", "slate")
                              : badge(titleCase(o.status), "amber")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <h3 className="mb-2 text-sm font-semibold text-ink">
                  Tasks <span className="font-normal text-ink-soft">({data.open_tasks} open{data.overdue_tasks ? `, ${data.overdue_tasks} overdue` : ""})</span>
                </h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={th}>Task</th>
                      <th className={th}>Domain</th>
                      <th className={th}>Priority</th>
                      <th className={th}>Status</th>
                      <th className={th}>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tasks.map((t) => (
                      <tr key={t.title} className="border-b border-line/60 last:border-0">
                        <td className={td}>{t.title}</td>
                        <td className={td}>
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: domainColor[t.domain as DomainKey] ?? "#98a1b2" }} aria-hidden />
                            {titleCase(t.domain)}
                          </span>
                        </td>
                        <td className={td}>
                          {t.priority === "high" ? badge("High", "red") : t.priority === "medium" ? badge("Medium", "amber") : badge("Low", "slate")}
                        </td>
                        <td className={td}>{titleCase(t.status)}</td>
                        <td className={`${tdNum} ${t.overdue ? "text-bad" : ""}`}>{t.due_date ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink">
                Business health scoreboard <span className="font-normal text-ink-soft">(how each score is built)</span>
              </h3>
              {health ? <HealthScoreboard health={health} detailed /> : <p className="text-sm text-ink-soft">Loading…</p>}
            </div>
          </div>
        </div>
      )}
    </Accordion>
  );
}

function FinanceDetails({ refreshKey }: { refreshKey: number }) {
  const { data, error, load } = useLazyLoad<FinanceAnalysis>("finance", refreshKey);
  const cur = data?.currency ?? "USD";
  return (
    <Accordion title="Finance Analysis" color={domainColor.finance} id="finance-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Profit &amp; loss</h3>
            <ul className="text-sm text-ink">
              {(
                [
                  ["Gross sales", data.gross_sales, ""],
                  ["Refunds", -data.refunds, ""],
                  ["Revenue", data.total_revenue, "font-semibold"],
                  ["  of which tax collected", data.tax_collected, "text-ink-soft"],
                  ["  of which shipping collected", data.shipping_collected, "text-ink-soft"],
                  ["Net sales", data.net_sales, ""],
                  ["Cost of goods sold", -data.cogs, ""],
                  ["Gross profit", data.gross_profit, "font-semibold"],
                  ["Total expenses", -data.total_expenses, ""],
                ] as [string, number, string][]
              ).map(([label, amount, cls]) => (
                <li key={label} className={`flex justify-between border-b border-line/60 py-1.5 ${cls}`}>
                  <span className="whitespace-pre">{label}</span>
                  <span className="tabular">{money(amount, cur)}</span>
                </li>
              ))}
              <li className="flex justify-between py-2 font-semibold">
                <span>Net profit</span>
                <span className={`tabular ${data.net_profit >= 0 ? "text-good" : "text-bad"}`}>
                  {money(data.net_profit, cur)} <span className="text-xs font-normal text-ink-soft">({pct(data.profit_margin_pct)} margin)</span>
                </span>
              </li>
            </ul>
            {data.unpaid_orders > 0 && (
              <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
                {data.unpaid_orders} order(s) worth {money(data.unpaid_value, cur)} are not yet paid.
              </p>
            )}

            <h3 className="mb-2 mt-5 text-sm font-semibold text-ink">Expenses by category</h3>
            <ul className="text-sm text-ink">
              {Object.entries(data.expenses_by_category).length === 0 && <li className="text-ink-soft">No expenses recorded.</li>}
              {Object.entries(data.expenses_by_category).map(([cat, amt]) => (
                <li key={cat} className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5 last:border-0">
                  <span className="flex-1">{cat}</span>
                  <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-line sm:block" aria-hidden>
                    <span className="block h-full rounded-full bg-good" style={{ width: `${data.total_expenses ? (amt / data.total_expenses) * 100 : 0}%` }} />
                  </span>
                  <span className="tabular">{money(amt, cur)}</span>
                </li>
              ))}
            </ul>

            {data.monthly.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 text-sm font-semibold text-ink">By month</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      <th className={th}>Month</th>
                      <th className={th}>Orders</th>
                      <th className={th}>Revenue</th>
                      <th className={th}>Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.map((m) => (
                      <tr key={m.month} className="border-b border-line/60 last:border-0">
                        <td className={tdNum}>{m.month}</td>
                        <td className={tdNum}>{m.orders}</td>
                        <td className={tdNum}>{money(m.revenue, cur)}</td>
                        <td className={tdNum}>{money(m.expenses ?? 0, cur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Expense lines <span className="font-normal text-ink-soft">(derived per order from Shopify)</span>
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Date</th>
                  <th className={th}>Category</th>
                  <th className={th}>Description</th>
                  <th className={th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((e, i) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    <td className={tdNum}>{e.date}</td>
                    <td className={td}>{e.category}</td>
                    <td className={td}>{e.description}</td>
                    <td className={tdNum}>{money(e.amount, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Accordion>
  );
}

export default function AnalysisSections({ refreshKey = 0, health }: { refreshKey?: number; health: HealthScore | null }) {
  return (
    <div className="space-y-3">
      <InventoryDetails refreshKey={refreshKey} />
      <MarketingDetails refreshKey={refreshKey} />
      <OperationsDetails refreshKey={refreshKey} health={health} />
      <FinanceDetails refreshKey={refreshKey} />
    </div>
  );
}
