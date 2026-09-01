# Upselling Product

Monorepo with a Next.js frontend and a FastAPI + PostgreSQL backend.

## Structure

```
.
├── frontend/          # Next.js (TypeScript, App Router, Tailwind CSS)
├── backend/           # FastAPI (Python, SQLAlchemy async, PostgreSQL)
│   ├── app/
│   │   ├── main.py            # FastAPI entrypoint
│   │   ├── core/config.py     # Settings (env-driven)
│   │   ├── db/                # Engine, session, ORM base
│   │   ├── api/v1/            # Versioned API routes
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # Business logic
│   ├── requirements.txt
│   └── .env.example
└── docker-compose.yml # PostgreSQL 16
```

## Getting started

### Database

```bash
docker compose up -d db
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs — health check: `GET /api/v1/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000
