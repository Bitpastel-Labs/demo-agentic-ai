"use client";

import { useEffect, useState } from "react";
import { getShopifyStatus, syncShopify, type ShopifyStatus } from "@/lib/api";
import { relativeTime } from "@/lib/format";

export default function ShopifySync({ onSynced }: { onSynced: () => void }) {
  const [status, setStatus] = useState<ShopifyStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showScopes, setShowScopes] = useState(false);

  const load = () => getShopifyStatus().then(setStatus).catch(() => setStatus(null));

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await syncShopify();
      setMessage(
        `Synced ${res.products_synced} variants, ${res.orders_synced} orders, ${res.campaigns_synced} campaigns, ${res.expenses_synced} expense lines · ${res.knowledge_indexed} records indexed for the agent`,
      );
      await load();
      onSynced();
    } catch {
      setMessage("Sync failed — check the Shopify access token in the backend .env");
    } finally {
      setSyncing(false);
    }
  };

  if (!status) return null;

  const storeName = status.shop_name ?? status.store_url?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const missing = Object.entries(status.missing_scopes ?? {});

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            status.configured ? "bg-good-soft text-good" : "bg-ground text-ink-soft"
          }`}
          title={status.configured ? `${status.store_url} · API ${status.api_version}` : undefined}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.configured ? "bg-good" : "bg-ink-faint"}`} aria-hidden />
          {status.configured ? `${storeName} · ${status.currency}` : "Shopify not connected — demo data"}
        </span>
        {status.configured && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
          >
            {syncing ? "Syncing…" : "Sync store data"}
          </button>
        )}
      </div>
      {status.configured && (
        <p className="text-right text-[11px] text-ink-faint">
          Last synced {relativeTime(status.last_synced_at)}
          {missing.length > 0 && (
            <>
              {" · "}
              <button onClick={() => setShowScopes((s) => !s)} className="underline decoration-dotted hover:text-ink-soft">
                {missing.length} optional scope{missing.length > 1 ? "s" : ""} not granted
              </button>
            </>
          )}
        </p>
      )}
      {showScopes && missing.length > 0 && (
        <ul className="max-w-sm rounded-lg border border-line bg-surface p-3 text-left text-[11px] text-ink-soft shadow-[0_4px_12px_rgba(16,24,40,0.08)]">
          <li className="mb-1 font-semibold text-ink">Grant these to the Shopify app for more first-party data:</li>
          {missing.map(([scope, why]) => (
            <li key={scope} className="py-0.5">
              <code className="rounded bg-ground px-1 text-ink">{scope}</code> — {why}
            </li>
          ))}
        </ul>
      )}
      {message && <span className="max-w-md text-right text-[11px] text-ink-soft">{message}</span>}
    </div>
  );
}
