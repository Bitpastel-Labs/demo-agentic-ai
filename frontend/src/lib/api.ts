/** Typed client for the FastAPI backend (see backend/app/api/v1). */

import type { DomainKey } from "./domains";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/* ------------------------------- dashboard ------------------------------- */

export interface DashboardSummary {
  inventory: {
    total_skus: number;
    total_units: number;
    stock_value: number;
    low_stock_count: number;
  };
  marketing: {
    active_campaigns: number;
    total_spend: number;
    total_revenue: number;
    roas: number;
  };
  operations: {
    total_orders: number;
    pending_orders: number;
    open_tasks: number;
    high_priority_tasks: number;
  };
  finance: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin_pct: number;
  };
}

export const getDashboardSummary = () => request<DashboardSummary>("/dashboard/summary");

/* -------------------------------- analysis -------------------------------- */

export interface InventoryAnalysis {
  total_skus: number;
  total_units: number;
  stock_value: number;
  low_stock_count: number;
  low_stock_items: { sku: string; name: string; stock_qty: number; reorder_level: number }[];
  products: {
    sku: string;
    name: string;
    category: string;
    price: number;
    cost: number;
    stock_qty: number;
    reorder_level: number;
    low_stock: boolean;
  }[];
}

export interface MarketingAnalysis {
  total_campaigns: number;
  active_campaigns: number;
  total_spend: number;
  total_revenue: number;
  roas: number;
  ctr_pct: number;
  campaigns: {
    name: string;
    platform: string;
    status: string;
    budget: number;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
  }[];
}

export interface OperationsAnalysis {
  total_orders: number;
  orders_by_status: Record<string, number>;
  pending_orders: number;
  open_tasks: number;
  high_priority_tasks: number;
  tasks: { title: string; priority: string; status: string; due_date: string | null }[];
  recent_orders: { order_number: string; customer_name: string; total: number; status: string }[];
}

export interface FinanceAnalysis {
  total_revenue: number;
  order_revenue: number;
  campaign_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin_pct: number;
  expenses_by_category: Record<string, number>;
  expenses: { category: string; description: string; amount: number; date: string }[];
}

export const getAnalysis = <T>(domain: DomainKey) => request<T>(`/analysis/${domain}`);

/* ---------------------------------- chat ---------------------------------- */

export interface ChatResponse {
  session_id: string;
  agent: string;
  reply: string;
}

/** Send one turn to a backend agent. `agent` defaults to the admin agent. */
export const sendChat = (message: string, sessionId?: string, agent?: string) =>
  request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId, ...(agent ? { agent } : {}) }),
  });

export const getAgents = () => request<{ agents: string[]; default: string }>("/chat/agents");

/* --------------------------------- shopify -------------------------------- */

export interface ShopifyStatus {
  configured: boolean;
  store_url: string | null;
}

export interface ShopifySyncResult {
  status: string;
  products_synced: number;
  orders_synced: number;
}

export const getShopifyStatus = () => request<ShopifyStatus>("/shopify/status");

export const syncShopify = () => request<ShopifySyncResult>("/shopify/sync", { method: "POST" });
