"use client";

import { useEffect, useState } from "react";
import { getShopifyStatus, syncShopify, type ShopifyStatus } from "@/lib/api";

export default function ShopifySync({ onSynced }: { onSynced: () => void }) {
  const [status, setStatus] = useState<ShopifyStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getShopifyStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await syncShopify();
      setMessage(`Synced ${res.products_synced} products, ${res.orders_synced} orders`);
      onSynced();
    } catch {
      setMessage("Sync failed — check the Shopify access token in backend/.env");
    } finally {
      setSyncing(false);
    }
  };

  if (!status) return null;

  const storeName = status.store_url?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {message && <span className="text-xs text-ink-soft">{message}</span>}
      <span
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          status.configured ? "bg-good-soft text-good" : "bg-ground text-ink-soft"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${status.configured ? "bg-good" : "bg-ink-faint"}`}
          aria-hidden
        />
        {status.configured ? storeName : "Shopify not connected"}
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
  );
}
