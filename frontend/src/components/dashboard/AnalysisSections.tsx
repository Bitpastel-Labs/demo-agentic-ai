"use client";

import { useState } from "react";
import Accordion from "./Accordion";
import { domainColor } from "@/lib/domains";
import {
  getAnalysis,
  type FinanceAnalysis,
  type InventoryAnalysis,
  type MarketingAnalysis,
  type OperationsAnalysis,
} from "@/lib/api";

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const badge = (text: string, tone: "green" | "amber" | "red" | "slate") => {
  const tones = {
    green: "bg-good-soft text-good",
    amber: "bg-warn-soft text-warn",
    red: "bg-bad-soft text-bad",
    slate: "bg-ground text-ink-soft",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{text}</span>;
};

function useLazyLoad<T>(domain: "inventory" | "marketing" | "operations" | "finance") {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const load = () => {
    getAnalysis<T>(domain)
      .then(setData)
      .catch(() => setError(true));
  };
  return { data, error, load };
}

function LoadingOrError({ error }: { error: boolean }) {
  return (
    <p className="text-sm text-ink-soft">{error ? "Details couldn't be loaded. Reopen to retry." : "Loading…"}</p>
  );
}

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-faint";
const td = "px-3 py-2 text-sm text-ink";
const tdNum = `${td} tabular`;

function InventoryDetails() {
  const { data, error, load } = useLazyLoad<InventoryAnalysis>("inventory");
  return (
    <Accordion title="Inventory Analysis" color={domainColor.inventory} id="inventory-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="overflow-x-auto">
          <p className="mb-3 text-sm text-ink-soft">
            {data.total_skus} SKUs · {data.total_units.toLocaleString()} units · stock value {money(data.stock_value)} ·{" "}
            {data.low_stock_count} low-stock item(s)
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>SKU</th>
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={th}>Price</th>
                <th className={th}>Stock</th>
                <th className={th}>Reorder Lvl</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.sku} className="border-b border-line/60 last:border-0">
                  <td className={tdNum}>{p.sku}</td>
                  <td className={td}>{p.name}</td>
                  <td className={td}>{p.category}</td>
                  <td className={tdNum}>{money(p.price)}</td>
                  <td className={tdNum}>{p.stock_qty}</td>
                  <td className={tdNum}>{p.reorder_level}</td>
                  <td className={td}>{p.low_stock ? badge("Low stock", "red") : badge("In stock", "green")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Accordion>
  );
}

function MarketingDetails() {
  const { data, error, load } = useLazyLoad<MarketingAnalysis>("marketing");
  return (
    <Accordion title="Marketing Analysis" color={domainColor.marketing} id="marketing-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="overflow-x-auto">
          <p className="mb-3 text-sm text-ink-soft">
            {data.active_campaigns}/{data.total_campaigns} campaigns active · spend {money(data.total_spend)} · revenue{" "}
            {money(data.total_revenue)} · ROAS {data.roas}x · CTR {data.ctr_pct}%
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Campaign</th>
                <th className={th}>Platform</th>
                <th className={th}>Status</th>
                <th className={th}>Spend / Budget</th>
                <th className={th}>Clicks</th>
                <th className={th}>Conv.</th>
                <th className={th}>Revenue</th>
                <th className={th}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.name} className="border-b border-line/60 last:border-0">
                  <td className={td}>{c.name}</td>
                  <td className={td}>{c.platform}</td>
                  <td className={td}>{c.status === "active" ? badge("Active", "green") : badge(c.status, "slate")}</td>
                  <td className={tdNum}>
                    {money(c.spend)} / {money(c.budget)}
                  </td>
                  <td className={tdNum}>{c.clicks.toLocaleString()}</td>
                  <td className={tdNum}>{c.conversions}</td>
                  <td className={tdNum}>{money(c.revenue)}</td>
                  <td className={tdNum}>{c.roas}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Accordion>
  );
}

function OperationsDetails() {
  const { data, error, load } = useLazyLoad<OperationsAnalysis>("operations");
  return (
    <Accordion title="Operations Analysis" color={domainColor.operations} id="operations-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto">
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Recent orders{" "}
              <span className="font-normal text-ink-soft">
                ({data.pending_orders} of {data.total_orders} awaiting fulfillment)
              </span>
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Total</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.order_number} className="border-b border-line/60 last:border-0">
                    <td className={tdNum}>{o.order_number}</td>
                    <td className={td}>{o.customer_name}</td>
                    <td className={tdNum}>{money(o.total)}</td>
                    <td className={td}>
                      {o.status === "fulfilled"
                        ? badge("Fulfilled", "green")
                        : o.status === "cancelled"
                          ? badge("Cancelled", "slate")
                          : badge(o.status, "amber")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Tasks <span className="font-normal text-ink-soft">({data.open_tasks} open)</span>
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Task</th>
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
                      {t.priority === "high"
                        ? badge("High", "red")
                        : t.priority === "medium"
                          ? badge("Medium", "amber")
                          : badge("Low", "slate")}
                    </td>
                    <td className={td}>{t.status.replace("_", " ")}</td>
                    <td className={tdNum}>{t.due_date ?? "—"}</td>
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

function FinanceDetails() {
  const { data, error, load } = useLazyLoad<FinanceAnalysis>("finance");
  return (
    <Accordion title="Finance Analysis" color={domainColor.finance} id="finance-analysis" onFirstOpen={load}>
      {!data ? (
        <LoadingOrError error={error} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Summary</h3>
            <ul className="space-y-1.5 text-sm text-ink">
              <li>
                Revenue: <span className="tabular font-medium">{money(data.total_revenue)}</span>{" "}
                <span className="text-ink-soft">
                  (orders {money(data.order_revenue)} + campaigns {money(data.campaign_revenue)})
                </span>
              </li>
              <li>
                Expenses: <span className="tabular font-medium">{money(data.total_expenses)}</span>
              </li>
              <li>
                Net profit:{" "}
                <span className={`tabular font-medium ${data.net_profit >= 0 ? "text-good" : "text-bad"}`}>
                  {money(data.net_profit)}
                </span>{" "}
                <span className="text-ink-soft">({data.profit_margin_pct}% margin)</span>
              </li>
            </ul>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-ink">Expenses by category</h3>
            <ul className="text-sm text-ink">
              {Object.entries(data.expenses_by_category).map(([cat, amt]) => (
                <li key={cat} className="flex justify-between border-b border-line/60 py-1.5 last:border-0">
                  <span>{cat}</span>
                  <span className="tabular">{money(amt)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-x-auto">
            <h3 className="mb-2 text-sm font-semibold text-ink">Recent expenses</h3>
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
                    <td className={tdNum}>{money(e.amount)}</td>
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

export default function AnalysisSections() {
  return (
    <div className="space-y-3">
      <InventoryDetails />
      <MarketingDetails />
      <OperationsDetails />
      <FinanceDetails />
    </div>
  );
}
