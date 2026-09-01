# Upselling Product

All-in-one AI business intelligence agent for an e-commerce store: **Inventory, Marketing, Operations and Finance** in a single dashboard with a domain-bounded chatbot.

## Structure

```
.
├── frontend/          # Next.js (TypeScript, App Router, Tailwind CSS)
│   └── src/
│       ├── app/page.tsx                    # Single dashboard page
│       ├── components/dashboard/           # KPI cards, chat panel, analysis accordions
│       └── lib/api.ts                      # Typed API client
└── backend/           # FastAPI (Python, SQLAlchemy async, SQLite)
    ├── app/
    │   ├── main.py                # Entrypoint; creates tables + seeds demo data on startup
    │   ├── core/config.py         # Env-driven settings
    │   ├── db/                    # SQLite models, session, seed data
    │   ├── agent/                 # LangChain agent (DeepSeek): prompts, tools, executor
    │   ├── services/insights.py   # Domain analytics shared by API + agent tools
    │   └── api/v1/                # /dashboard/summary, /analysis/{domain}, /chat, /health
    ├── requirements.txt
    └── .env.example
```

## The agent

A single LangChain tool-calling agent (DeepSeek `deepseek-chat`) with four tools — inventory, marketing, operations, finance data. Its system prompt strictly bounds it to those domains: any off-topic question is refused with a fixed message. Chat history is persisted in SQLite per session.

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
