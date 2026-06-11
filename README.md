# GroupBuy KZ

Hackathon MVP of a Pinduoduo-style collective buying platform for Kazakhstan.
The product is built around a simple loop: find a deal, join a team, invite friends through Telegram, and unlock a lower price when the team fills.

## Why It Wins

- Social commerce mechanics, not a plain marketplace catalog.
- Team progress changes price in real time, so every invite has visible value.
- Telegram invite flow creates a viral loop that can be demoed in 30 seconds.
- SIM trust is shown as a product concept for safer local group buying.
- Gamified coupons, coins, daily mission, hot teams, urgency timers, and deal-complete modal are already in the UI.

## Demo Script

1. Open `http://127.0.0.1:3000/feed`.
2. Click a coupon on top. Coins and daily progress update immediately.
3. Open a hot product, for example Xiaomi Redmi Watch 4 or Dyson Supersonic.
4. Click `Войти в команду`. The member count grows and the group price drops.
5. Click `Скопировать invite`. A local friend simulation starts: people arrive, join, and the deal closes.
6. Show the success modal with final price and savings.
7. Open `http://127.0.0.1:3000/join/g001` to show the Telegram landing page for invited friends.
8. Open `/groups` to show active teams sorted by savings, timer, or category.

## Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, lucide-react
- Backend: FastAPI, Pydantic v2, Python 3.11
- Data: JSON seed files, no external database
- Auth: mock JWT stored in localStorage

## Run Locally

Backend:

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Open:

```text
http://127.0.0.1:3000/feed
```

Optional frontend env:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Quality Checks

```bash
cd backend
python3 -m compileall . -q
```

```bash
cd frontend
pnpm exec tsc --noEmit
pnpm run build
```

## Product Routes

- `/register` - mock onboarding with SIM-trust concept
- `/feed` - Pinduoduo-style deal feed, coupons, hot teams, daily mission
- `/product/[id]` - team-buy product page with price drop and invite simulation
- `/join/[groupId]` - Telegram invite landing page for friends
- `/groups` - active buying teams with sorting and conversion metrics

## API

All responses follow:

```json
{ "data": {}, "success": true, "message": "OK" }
```

Main endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /products`
- `GET /products/{id}`
- `GET /feed?user_id=u001&limit=20`
- `GET /groups`
- `GET /groups/{id}`
- `POST /groups/{id}/join`
- `GET /recommend?user_id=u001&limit=10`

## Project Structure

```text
backend/
  data/          seed products, groups, users, sessions
  models/        Pydantic schemas
  routers/       auth, products, feed, groups, recommend
  services/      recommender and group pricing logic
frontend/
  app/           register, feed, product, invite, groups routes
  components/    UI, auth, product visual, deal modal
  lib/           API client, Zustand store, formatting utilities
  types/         TypeScript API contracts
```

## Notes

- Seed data is intentionally simple and stored in `backend/data/*.json`.
- Joining a group mutates `backend/data/groups.json`, which is useful for the demo. Reset that file before recording a fresh run if needed.
- Product visuals are generated in the frontend from product/category metadata, so the demo does not depend on random external images.
