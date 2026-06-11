# GroupBuy — Hackathon MVP

## What this is
Collective purchasing platform. Users join group buys to unlock wholesale prices.
SIM/eSIM identity is UI concept only — no real telecom integration.

## Stack
- Frontend: Next.js 14 App Router, TypeScript, Tailwind, Zustand
- Backend: FastAPI, Pydantic v2, Python 3.11
- Data: JSON mock files (no DB)
- Auth: JWT (mock, stored in localStorage)

## Run locally
```bash
# Backend
cd backend && uv sync && uv run uvicorn main:app --reload --port 8000

# Frontend
cd frontend && pnpm install && pnpm dev
```

## Key files
- `backend/services/recommender.py` — tag intersection scoring
- `backend/services/group_pricing.py` — linear price interpolation
- `frontend/lib/store.ts` — Zustand state (userProfile, groups)
- `frontend/lib/utils.ts` — formatPrice() with KZT/RUB/USD

## Mock data
All in `backend/data/*.json`. 25 products, 8 groups, 5 users.
Tags must match between users.interests and products.tags for recommender to work.

## The hero interaction
Join group button → optimistic +1 member → price animate-down → "You saved $X" state.
This is what the jury will remember. Keep it fast and satisfying.
