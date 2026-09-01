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
    <div className="flex items-center gap-3">
      {message && <span className="text-xs text-slate-400">{message}</span>}
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          status.configured ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"
        }`}
      >
        {status.configured ? `Shopify: ${storeName}` : "Shopify not connected"}
      </span>
      {status.configured && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-40"
        >
          {syncing ? "Syncing…" : "Sync store data"}
        </button>
      )}
    </div>
  );
}
