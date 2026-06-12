# Birge — collective buying for Kazakhstan

> "Birge" (Kazakh for *together*) — Pinduoduo-style group buying: find a deal, build a team,
> send one invite link, watch the price drop in real time. Buyers & sellers, SIM/eSIM auth,
> a Gemini AI buyer, and a Django admin.
>
> 👉 First time here? Read **[SETUP.md](SETUP.md)** — what to install, which keys are optional,
> and the test accounts.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django)
![DRF](https://img.shields.io/badge/DRF-3.15-A30000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-4.5-orange)

---

## The Viral Loop

```
User opens feed → claims coupon → joins group → copies invite link
       ↓                                                ↓
  coins + mission                          friends arrive via Telegram
       ↓                                                ↓
 daily streak                          price drops with each member
                                                        ↓
                                             deal closes → success modal
                                                        ↓
                                              everyone invites more people
```

Every invite has **visible, immediate value** — the price on screen drops the moment a friend joins. That's the mechanic judges remember.

---

## Screenshots

| Register | Feed |
|----------|------|
| ![register](screenshots/register.png) | ![feed](screenshots/feed.png) |

| Product page | Groups |
|--------------|--------|
| ![product](screenshots/product.png) | ![groups](screenshots/groups.png) |

| Profile & Leaderboard | Telegram Invite Landing |
|-----------------------|------------------------|
| ![profile](screenshots/profile.png) | ![join](screenshots/join.png) |

---

## Features

### Core mechanics
- **Group pricing** — linear interpolation from `price_individual` to `price_group_min` as members fill the team. Every join drops the price for everyone.
- **Optimistic UI** — price updates instantly on click, then reconciles with the server response. Zero perceived latency.
- **Real recruitment** — joining writes a `Membership` (1 SIM = 1 seat); people who open your
  invite link actually join, and the product/invite pages poll every 3s so the price drops live.
- **Telegram share** — native deep link with pre-filled message and group URL. One tap from the product page.

### Preview vs real mode
- **Preview mode** — "Посмотреть демо без входа" on the landing: a guest explores on bundled
  in-browser data with the scripted "live" experience (activity toasts, friend simulation)
- **Real notifications** — logged-in users get genuine notifications (bell + Web Notifications)
  when a teammate actually joins their group or a team completes — polled from `/me/groups`

### Engagement & retention
- **Live activity toasts** — floating notifications ("Айгерим вступила через Telegram", "Команда закрылась!"), shown in **preview mode** to make the demo feel alive
- **Ticking countdown timers** — real-time urgency. Turns orange < 1 hour, red < 10 minutes
- **"N watching now"** counter on product pages — social proof
- **Daily mission bar** — 3 actions → unlock hidden coupon. Progress visible on every page
- **Gamified coupons** — 4 claimable coupons, each adds coins and mission progress
- **Coin wallet** — earned by claiming coupons, completing missions, inviting friends
- **Day streak tracker** — visual Пн–Вс grid, pushes daily return
- **Achievements** — Первый invite, Команда x3, Серия 3 дня, Топ-5 недели
- **Leaderboard** — top inviters of the week with savings shown

### Accounts, roles & seller cabinet
- **RBAC** — buyer / seller roles (DRF token auth) + a full **Django admin** (`/admin/`)
- **SIM/eSIM sign-up** — register with a KZ phone (formatted as you type), verify an OTP
  (1 SIM = 1 account). Real SMS gateway layer — **Twilio / Mobizon (KZ) / SMSC**, or `console`
  in dev (code shown in-form). Anti-spam cooldown; login by password or by SMS code
- **Seller cabinet** (`/seller`) — sellers add/delete their own products; a starter group
  is created automatically so the join/price-drop flow works on day one

### Discovery & trust
- **AI buyer** (`/ai`) — free-text queries («робот-пылесос до 80 000 ₸») → finds a product,
  picks an active group close to closing or creates a new one. Real **Google Gemini**
  (set `GEMINI_API_KEY`) over the DB catalog, with a rule-based NLU fallback (budget + RU/KZ keywords)
- **Web product search** — when nothing matches the DB, the AI buyer pulls a **real product
  from the web** (SerpApi Google Shopping, set `SERPAPI_KEY`), saves it, and forms a group around it
- **Live group updates** — product/invite pages poll every 3s: a join on one phone makes
  the price visibly drop on the other (the two-device demo)
- **KZ/RU localization** — ҚАЗ/РУС switcher in the feed header (nav, hero, key CTAs)
- **Dark mode** — 🌙/☀️ toggle in the feed header, persisted; coherent across all screens
- **AI-powered feed** — tag-intersection + budget-bonus recommender scores each product per user
- **Real search** — filters by product name and tags live as you type
- **SIM/eSIM trust** — real OTP binding (1 SIM = 1 account) to keep groups free of bot/fake fills
- **Category filters + budget slider** — instant client-side filtering
- **"Горящие команды"** — top-3 groups by fill progress, shown on every feed page

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite, React Router 6, TypeScript, Tailwind CSS (dark mode) |
| State | Zustand with `persist` middleware (token + session in localStorage) |
| Icons | lucide-react |
| Backend | Django 5 + Django REST Framework, **SQLite (ORM)**, Python 3.11+ |
| Auth | DRF **TokenAuthentication** + **SIM/eSIM OTP** (KZ phone); Django admin |
| RBAC | `buyer` / `seller` roles; seller cabinet; superuser admin at `/admin/` |
| AI | Google **Gemini** (REST) over the DB catalog + rule-based fallback; **SerpApi** web search |
| Config | everything via `.env` (python-dotenv) — see `backend/.env.example`, `frontend/.env.example` |
| Package mgr | npm/pnpm (frontend), pip/uv (backend) |

---

## Quick Start

**Backend** (Django + DRF + SQLite)

```bash
cd backend
python -m venv .venv
# Windows:        .venv\Scripts\activate
# macOS / Linux:  source .venv/bin/activate
pip install "django>=5.0,<6.0" "djangorestframework>=3.15" "django-cors-headers>=4.4" "requests>=2.31"
python manage.py migrate        # create the SQLite DB
python manage.py seed_demo      # REQUIRED: catalog + test accounts + admin
python manage.py runserver 127.0.0.1:8000
```

> See **[SETUP.md](SETUP.md)** for the full "what you need from me" guide
> (Gemini key, accounts, admin). For the real AI buyer, set `GEMINI_API_KEY`
> before `runserver` — otherwise it falls back to the rule-based matcher.
> Test accounts: buyer `+77000000001` / seller `+77000000002` / `birge123`;
> Django admin `admin` / `admin123` at `/admin/`.

**Frontend** (React + Vite)

```bash
cd frontend
npm install     # or: pnpm install
npm run dev     # or: pnpm dev
```

**Open** → `http://127.0.0.1:5173/feed`

**Optional env** (frontend already defaults to this):

```bash
# frontend/.env.local
VITE_API_URL=http://127.0.0.1:8000
```

> For the two-phone LAN demo, set `VITE_API_URL` to the laptop's LAN IP
> (e.g. `http://192.168.0.10:8000`); the Vite dev server already binds to the LAN.

---

## Deploy to Vercel

The frontend deploys to Vercel as a fully standalone demo — when the Django
backend is unreachable, the app automatically switches to a bundled in-browser
demo API (same data, same pricing math, joins persist in localStorage) and
shows a small "demo data" chip. Zero backend infrastructure needed.

```bash
npm i -g vercel
cd frontend
vercel          # preview deploy
vercel --prod   # production deploy
```

Or import the repo at vercel.com → set **Root Directory = `frontend`** —
the Vite framework preset and `vercel.json` (SPA rewrites) handle the rest.
To use a real hosted backend instead, set the `VITE_API_URL` env var in the
Vercel project settings.

---

## Demo Script (~60 seconds)

1. Landing `/` → **"Посмотреть демо без входа"** (preview) — or log in as the buyer test account
2. `/ai` — type «робот-пылесос до 80 000 ₸» → AI finds a product + group, tap **"Открыть и вступить"**
3. On the product page tap **"Войти в команду"** — price drops instantly (optimistic, then reconciled)
4. **Two-device live drop:** open the same `/product/:id` on a second device/tab, join there →
   the first screen's price drops within ~3s, and (logged in) a **notification** fires
5. Open `/join/:groupId` — the invite landing a friend receives
6. Log in as the **seller** (`+77000000002` / `birge123`) → **Магазин** → add a product (a group is auto-created)
7. `/admin/` (`admin` / `admin123`) — Django admin over Products / Groups / Users
8. Toggle 🌙 dark mode and ҚАЗ language in the feed header

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | public | Marketing landing — CTAs to register / login / **preview without login** |
| `/register` | public | Role (buyer/seller) → KZ phone → SIM OTP → profile |
| `/login` | public | Phone + password, or phone + SMS code (eye toggle, phone formatting) |
| `/feed` | auth | Deal catalog with hot teams, AI-buyer entry, search, filters, notifications bell |
| `/ai` | auth | AI buyer chat (Gemini) — query → product + group card |
| `/product/:id` | auth | Team-buy page — join → invite → live price drop |
| `/join/:groupId` | auth | Invite landing for incoming friends (live updates) |
| `/groups` | auth | All active teams, sortable by savings / timer / category |
| `/seller` | seller | Seller cabinet — add / delete own products |
| `/profile` | auth | Role, coins, streak, achievements, leaderboard, active deals, logout |
| `/admin/` | superuser | Django admin (Products, Groups, Users, Memberships, Tokens) |

---

## API

All responses:

```json
{ "data": {}, "success": true, "message": "OK" }
```

Authenticated requests send `Authorization: Token <key>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/sim/request` | Send OTP (`purpose: register \| login`); cooldown-throttled |
| `POST` | `/auth/register` | Create user after OTP verify → DRF token + user |
| `POST` | `/auth/login` | Login by phone + password **or** phone + code → token |
| `GET` | `/auth/me` | Current user (token) |
| `GET` | `/me/groups` | Groups the user joined (powers real notifications) |
| `GET` | `/products` · `/products/{id}` | Catalog · product + active group |
| `GET` | `/feed` · `/recommend` | Personalized feed / recommendations (recommender) |
| `GET` | `/groups` · `/groups/{id}` | Active/completed groups · group + product |
| `POST` | `/groups/{id}/join` | Join group (Membership), recalculate price |
| `POST` | `/groups/create` | Find-or-create an active group for a product |
| `POST` | `/ai/buyer` | AI buyer: query → product + group (Gemini → rules → web search) |
| `GET POST` | `/seller/products` | Seller: list / add own products *(IsSeller)* |
| `PATCH DELETE` | `/seller/products/{id}` | Seller: edit / delete own product *(IsSeller)* |

---

## How Pricing Works

```python
# Linear interpolation as team fills
progress = current_members / threshold          # 0.0 → 1.0
discount = price_individual - price_group_min
price = price_individual - discount * progress  # drops smoothly
```

The same formula runs identically in Python (backend) and TypeScript (frontend) for optimistic updates.

---

## Recommender

```python
# Tag intersection + budget bonus scoring
overlap = len(user.interests ∩ product.tags) / len(user.interests)
budget_bonus = 1.5 if product.price_individual <= user.budget_usd else 0.8
score = (overlap * budget_bonus, product.rating)
```

---

## Project Structure

```
backend/
├── .env.example    all backend config (Gemini · SerpApi · SMS · seed creds)
├── data/           seed JSON — demo products + 200 real Open Facts products
├── groupbuy/       Django project (settings · urls · wsgi/asgi)
└── api/            Django app
    ├── models.py       User(role/phone/sim) · Product · Group · Membership · SimVerification
    ├── views.py        endpoints: auth/SIM · products · feed · ai · groups · seller
    ├── urls.py         URL routing (no trailing slashes — matches the fetch client)
    ├── serialize.py    model → dict (shape shared by services + frontend)
    ├── permissions.py  IsSeller
    ├── admin.py        Django admin registration
    ├── responses.py · exceptions.py   shared ApiResponse envelope
    ├── services/       ai_buyer (Gemini) · external_search (SerpApi) · sim · sms
    │                   group_pricing · group_status · recommender
    └── management/commands/seed_demo.py   catalog + test accounts + admin

frontend/
├── .env.example · vercel.json · vite.config.ts
└── src/
    ├── main.tsx · App.tsx (routes + RequireAuth/RequireSeller guards) · index.css
    ├── layout/         Layout (preview banner · notifications poller · BottomNav)
    ├── pages/          Landing · Register · Login · Feed · Ai · Product · Join · Groups · SellerAdmin · Profile
    ├── components/ui/  Button · Badge · Card · ProgressBar · Skeleton · BottomNav
    │                   CountdownTimer · LiveActivity · DealSuccessModal · NotificationsBell
    ├── components/product/  ProductCard · ProductVisual · GroupProgress
    ├── lib/            api.ts · store.ts · utils.ts · demo.ts · i18n.ts · useRealNotifications.ts
    └── types/          index.ts — full API contract mirrors
```

---

## Seed Data Reset

The DB (SQLite) is the source of truth. Re-seed catalog + test accounts + admin
anytime (idempotent — wipes and recreates the demo data):

```bash
cd backend && python manage.py seed_demo
```

## Real Product Catalog

The catalog includes 200 real products imported from public Open Facts APIs:

- `OpenFoodFacts` — real food items with barcode/source URLs and product photos
- `OpenBeautyFacts` — real beauty/cosmetics items
- `OpenProductsFacts` — real non-food catalog items

Some products also include observed store prices from Open Prices (`source_price`, `source_currency`, `source_location`). To refresh the real catalog while preserving demo products used by active groups:

```bash
node scripts/import_openfacts_products.mjs
```

---

## Quality

```bash
# TypeScript
cd frontend && npm run typecheck

# Django system checks
cd backend && python manage.py check

# Production build
cd frontend && npm run build
```

---

## What's Mock / What's Real

| Feature | Status |
|---------|--------|
| Database | ✅ SQLite via Django ORM |
| Auth | ✅ DRF TokenAuthentication + RBAC (buyer/seller) + Django admin |
| SIM/eSIM verification | ✅ Real OTP + SMS gateway layer (Twilio/Mobizon/SMSC; `console` in dev) |
| Group recruitment | ✅ Real Membership joins via invite link (1 SIM = 1 seat) |
| Notifications | ✅ Real (poll `/me/groups` + Web Notifications) for logged-in users |
| Seller cabinet | ✅ Add/delete own products → group auto-created |
| AI buyer | ✅ Real Gemini over the DB (rule-based fallback) |
| Web product search | ✅ Real (SerpApi) when DB has no match — needs `SERPAPI_KEY` |
| Group pricing / recommender / optimistic UI / timers | ✅ Real |
| Preview mode (toasts, friend simulation, "watching now") | 🎭 Scripted — preview only |
| Payments | 🎭 Not implemented (Vision stage) |
| Vercel standalone mode | 🎭 Bundled in-browser demo API (auto-fallback, incl. auth/seller) |
