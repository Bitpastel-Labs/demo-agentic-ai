/** Typed client for the FastAPI backend (see backend/agentic-ai-backend/app/api/v1). */

import type { DomainKey } from "./domains";

/**
 * NEXT_PUBLIC_API_URL may be given with or without the `/api/v1` prefix
 * (`http://localhost:8000` and `http://localhost:8000/api/v1` both work).
 */
function resolveApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

export const API_BASE = resolveApiBase();

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

/* --------------------------------- store ---------------------------------- */

export interface StoreMeta {
  shop_name: string | null;
  currency: string;
  timezone: string | null;
  last_synced_at: string | null;
  /** "shopify_marketing" | "order_attribution" | "demo" */
  campaign_source: string;
  scopes: string[];
  missing_scopes: Record<string, string>;
}

/* -------------------------------- health ---------------------------------- */

export type HealthStatus = "healthy" | "watch" | "at_risk";

export interface HealthComponent {
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface DomainHealth {
  score: number;
  status: HealthStatus;
  grade: string;
  components: HealthComponent[];
}

export interface HealthScore {
  overall: { score: number; status: HealthStatus; grade: string };
  domains: Record<DomainKey, DomainHealth>;
  generated_at: string;
}

export const getHealthScore = () => request<HealthScore>("/dashboard/health");

/* ---------------------------- priority actions ---------------------------- */

export type Severity = "critical" | "high" | "medium" | "low";

export interface PriorityAction {
  domain: DomainKey;
  severity: Severity;
  title: string;
  detail: string;
  metric: string;
  next_step: string;
}

export interface PriorityActions {
  generated_at: string;
  currency: string;
  counts: Record<Severity, number>;
  actions: PriorityAction[];
  by_domain: Record<DomainKey, PriorityAction[]>;
}

export const getPriorityActions = () => request<PriorityActions>("/dashboard/priority-actions");

/* ------------------------------- dashboard ------------------------------- */

export interface DashboardSummary {
  meta: StoreMeta;
  inventory: {
    total_skus: number;
    total_units: number;
    stock_value: number;
    retail_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    missing_cost_count: number;
  };
  marketing: {
    total_campaigns: number;
    active_campaigns: number;
    total_spend: number;
    total_revenue: number;
    total_conversions: number;
    roas: number | null;
    attribution_rate_pct: number;
    campaign_source: string;
  };
  operations: {
    total_orders: number;
    pending_orders: number;
    pending_value: number;
    fulfillment_rate_pct: number;
    orders_last_30d: number;
    revenue_last_30d: number;
    open_tasks: number;
    high_priority_tasks: number;
    overdue_tasks: number;
  };
  finance: {
    total_revenue: number;
    net_sales: number;
    cogs: number;
    gross_profit: number;
    gross_margin_pct: number;
    total_expenses: number;
    net_profit: number;
    profit_margin_pct: number;
    unpaid_orders: number;
    refunds: number;
  };
  health: HealthScore;
}

export const getDashboardSummary = () => request<DashboardSummary>("/dashboard/summary");

/* -------------------------------- analysis -------------------------------- */

export interface InventoryAnalysis {
  currency: string;
  total_skus: number;
  total_products: number;
  total_units: number;
  stock_value: number;
  retail_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  missing_cost_count: number;
  draft_or_archived: number;
  categories: { category: string; skus: number; units: number; low_stock: number }[];
  low_stock_items: { sku: string; name: string; stock_qty: number; reorder_level: number }[];
  products: {
    sku: string;
    name: string;
    category: string;
    vendor: string | null;
    status: string;
    price: number;
    cost: number | null;
    stock_qty: number;
    reorder_level: number;
    low_stock: boolean;
    out_of_stock: boolean;
  }[];
}

export interface MarketingAnalysis {
  currency: string;
  campaign_source: string;
  total_campaigns: number;
  active_campaigns: number;
  total_spend: number;
  total_budget: number;
  total_revenue: number;
  total_conversions: number;
  roas: number | null;
  ctr_pct: number | null;
  avg_order_value: number;
  attributed_orders: number;
  attribution_rate_pct: number;
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
    roas: number | null;
    attribution: string | null;
    last_order_at: string | null;
  }[];
}

export interface OperationsAnalysis {
  currency: string;
  total_orders: number;
  orders_by_status: Record<string, number>;
  orders_by_channel: Record<string, number>;
  pending_orders: number;
  pending_value: number;
  fulfillment_rate_pct: number;
  cancellation_rate_pct: number;
  orders_last_30d: number;
  revenue_last_30d: number;
  avg_order_value: number;
  open_tasks: number;
  high_priority_tasks: number;
  overdue_tasks: number;
  tasks: {
    title: string;
    priority: string;
    status: string;
    domain: string;
    due_date: string | null;
    overdue: boolean;
  }[];
  recent_orders: {
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    financial_status: string | null;
    channel: string | null;
    items: number;
    created_at: string | null;
  }[];
}

export interface FinanceAnalysis {
  currency: string;
  total_revenue: number;
  gross_sales: number;
  net_sales: number;
  refunds: number;
  tax_collected: number;
  shipping_collected: number;
  discounts_given: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  total_expenses: number;
  net_profit: number;
  profit_margin_pct: number;
  unpaid_orders: number;
  unpaid_value: number;
  expenses_by_category: Record<string, number>;
  monthly: { month: string; revenue: number; orders: number; expenses?: number }[];
  expenses: {
    category: string;
    description: string;
    amount: number;
    date: string;
    order_number: string | null;
    source: string;
  }[];
}

export const getAnalysis = <T>(domain: DomainKey) => request<T>(`/analysis/${domain}`);

/* ---------------------------------- chat ---------------------------------- */

export interface ChatResponse {
  session_id: string;
  agent: string;
  reply: string;
}

/** Send one turn to a backend agent and wait for the whole reply. `agent` defaults to the admin agent. */
export const sendChat = (message: string, sessionId?: string, agent?: string) =>
  request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId, ...(agent ? { agent } : {}) }),
  });

export interface AgentInfo {
  name: string;
  label: string;
  description: string;
  has_memory: boolean;
}

export const getAgents = () => request<{ agents: AgentInfo[]; default: string }>("/chat/agents");

export interface MemoryStats {
  backend: "pgvector" | "sqlite-json";
  embedding_model: string;
  chunks: Record<string, number>;
}

export const getMemoryStats = () => request<MemoryStats>("/chat/memory");

export type ChatStreamEvent =
  | { type: "session"; session_id: string; agent: string }
  | { type: "token"; text: string }
  | { type: "reset" }
  | { type: "tool"; name: string; phase: "start" | "end" }
  | { type: "done"; session_id: string; reply: string }
  | { type: "error"; message: string };

/**
 * Send one turn and receive the reply as it is written (Server-Sent Events).
 * Calls `onEvent` for every event; resolves when the stream closes.
 */
export async function streamChat(
  message: string,
  sessionId: string | undefined,
  onEvent: (event: ChatStreamEvent) => void,
  agent?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, ...(agent ? { agent } : {}) }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`POST /chat/stream failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) continue;
      try {
        const data = JSON.parse(dataLines.join("\n"));
        onEvent({ type: eventName, ...data } as ChatStreamEvent);
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}

/* --------------------------------- shopify -------------------------------- */

export interface ShopifyStatus extends StoreMeta {
  configured: boolean;
  store_url: string | null;
  api_version: string;
}

export interface ShopifySyncResult {
  status: string;
  products_synced: number;
  orders_synced: number;
  campaigns_synced: number;
  expenses_synced: number;
  tasks_synced: number;
  knowledge_indexed: number;
  campaign_source: string;
  currency: string;
  last_synced_at: string;
}

export const getShopifyStatus = () => request<ShopifyStatus>("/shopify/status");

export const syncShopify = () => request<ShopifySyncResult>("/shopify/sync", { method: "POST" });
