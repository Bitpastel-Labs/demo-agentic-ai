# Upselling Product

All-in-one AI business intelligence agent for an e-commerce store: **Inventory, Marketing, Operations and Finance** in a single dashboard with a domain-bounded chatbot.

## Structure

```
.
├── frontend/          # Next.js (TypeScript, App Router, Tailwind CSS)
│   └── src/
│       ├── app/page.tsx                    # Single dashboard page
│       ├── components/dashboard/           # KPI cards, chat panel, analysis accordions
│       └── lib/                          # Typed API client + domain metadata
└── backend/           # FastAPI (Python, SQLAlchemy async, SQLite)
    ├── app/
    │   ├── main.py                # Entrypoint; creates tables + seeds demo data on startup
    │   ├── core/config.py         # Env-driven settings
    │   ├── db/                    # SQLite models, session, seed data
    │   ├── agent/                 # LangChain agents (DeepSeek)
    │   │   ├── base.py            #   Shared LLM, prompt scaffold, executor + streaming
    │   │   ├── registry.py        #   Name -> agent, used by the chat endpoints
    │   │   ├── admin_agent/       #   Staff-facing: inventory/marketing/ops/finance
    │   │   └── customer_support_agent/   # Shopper-facing: products, orders, policies
    │   ├── services/
    │   │   ├── insights.py        # Admin analytics (API + admin agent tools)
    │   │   └── storefront.py      # Customer-safe product/order views (support tools)
    │   └── api/v1/                # /dashboard/summary, /analysis/{domain}, /chat,
    │                              # /support/chat (SSE), /shopify/*, /health
    ├── requirements.txt
    └── .env.example
```

## The agents

Agents live under `backend/app/agent/`, one package each. `base.py` holds everything they
share — the DeepSeek (`deepseek-chat`) client, the prompt scaffold, the executor, the
chat-history conversion and the token streaming — so a package only supplies a **system
prompt** and a **tool list**.

- **`admin_agent`** — the dashboard's business intelligence agent, with four tools (inventory,
  marketing, operations, finance data), reading through `services/insights.py`. Its system
  prompt strictly bounds it to those domains: any off-topic question is refused with a fixed
  message. Staff-facing.
- **`customer_support_agent`** — the shopper-facing agent, with four tools (product search,
  categories, order status by order number, store policies), reading through
  `services/storefront.py`. That service deliberately exposes only what a shopper may see —
  never cost, margin, campaign or whole-store figures, and orders only one at a time by
  number. The prompt refuses internal business questions on top of that.

`registry.py` maps a name to an `Agent` (its runner and its streamer).
`GET /chat/agents` lists what is registered. Chat history is persisted in SQLite per session.

### Endpoints

| Endpoint | Agent | Shape |
| --- | --- | --- |
| `POST /chat` | any, via `"agent"` (default `admin`) | JSON reply |
| `POST /support/chat` | pinned to `customer_support` | **SSE stream** |

`/support/chat` is deliberately pinned: it takes no agent name, so a public storefront client
can never point it at the admin agent. Its sessions carry a `cs_` id prefix and only ever load
their own history.

### Streaming (`POST /support/chat`)

Request `{"message": "...", "session_id": "cs_..."}` (omit `session_id` on the first turn).
The response is `text/event-stream`:

| Event | Payload | Meaning |
| --- | --- | --- |
| `session` | `{session_id, agent}` | sent first — keep the id for the next turn |
| `token` | `{text}` | a piece of the reply, as the model writes it |
| `reset` | `{}` | discard the reply shown so far (see below) |
| `tool` | `{name, phase}` | the agent is looking something up |
| `done` | `{session_id, reply}` | the finished reply |
| `error` | `{message}` | the turn failed; nothing was saved |

A tool-calling agent often thinks out loud ("let me check that…") before reaching for a tool,
and that commentary is not part of the answer it settles on. `reset` fires when a tool starts,
so **the tokens after the last `reset` are exactly the reply** — what the shopper watches being
typed matches what `done` returns and what is saved.

```bash
curl -N -X POST localhost:8000/api/v1/support/chat -H "Content-Type: application/json" -d "{\"message\": \"Where is order #1027?\"}"
```

### Adding an agent

1. Create `backend/app/agent/<name>_agent/` with `prompts.py`, `tools.py` and `agent.py`
   (mirror `admin_agent`; `agent.py` is a few lines on top of `build_agent_executor`,
   `run_executor` and `stream_executor`), ending in an `Agent(...)` instance.
2. Add that `Agent` to `AGENTS` in `backend/app/agent/registry.py`.

It is then reachable as `{"agent": "<name>"}` on `/chat`, with no API changes.

## Getting started (no Docker)

### Backend

```bash
cd backend
uv venv .venv && uv pip install -r requirements.txt --python .venv/bin/python
cp .env.example .env   # fill in DEEPSEEK_API_KEY (+ Shopify creds)
.venv/bin/uvicorn app.main:app --reload --port 8000
```

The SQLite database (`upselling.db`) is created and seeded with demo data automatically on first start.
API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://localhost:3000
