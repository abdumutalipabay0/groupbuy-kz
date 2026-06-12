# GroupBuy — Hackathon MVP

## What this is
Collective purchasing platform. Users join group buys to unlock wholesale prices.
SIM/eSIM identity is UI concept only — no real telecom integration.

## Stack
- Frontend: React 18 + Vite, React Router 6, TypeScript, Tailwind, Zustand
- Backend: Django 5 + Django REST Framework, SQLite (ORM), Python 3.11+
- RBAC: buyer / seller roles + Django admin (superuser); DRF Token auth
- Auth: SIM/eSIM OTP verification (KZ phone), token stored in localStorage
- AI: Google Gemini (REST) with rule-based fallback; reads catalog from DB
- `data/*.json` is the **seed source** loaded via `manage.py seed_demo` (DB is truth)

## Run locally  (see SETUP.md for the full "what you need" guide)
```bash
# Backend
cd backend && python -m venv .venv && . .venv/Scripts/activate \
  && pip install "django>=5.0,<6.0" "djangorestframework>=3.15" "django-cors-headers>=4.4" "requests>=2.31" \
  && python manage.py migrate && python manage.py seed_demo \
  && python manage.py runserver 127.0.0.1:8000
# optional real AI:  set GEMINI_API_KEY before runserver

# Frontend
cd frontend && npm install && npm run dev   # http://127.0.0.1:5173
```

## Test accounts (from seed_demo)
- Buyer  `+77000000001` / `birge123`   · Seller `+77000000002` / `birge123`
- Django admin `admin` / `admin123` → http://127.0.0.1:8000/admin/

## Key files
- `backend/api/models.py` — User(role/phone/sim), Product, Group, Membership, SimVerification
- `backend/api/views.py` — all endpoints (auth/SIM, products, feed, AI, groups, seller cabinet)
- `backend/api/serialize.py` — model→dict (the shape services + frontend expect)
- `backend/api/services/sim.py` — KZ phone normalize + OTP request/verify
- `backend/api/services/ai_buyer.py` — Gemini `gemini_select()` + rule-based fallback over DB
- `backend/api/services/recommender.py` / `group_pricing.py` — scoring / price interpolation
- `backend/api/admin.py` — Django admin registration
- `backend/api/management/commands/seed_demo.py` — seed catalog + accounts + admin
- `frontend/src/lib/api.ts` — fetch client (adds `Authorization: Token …` from store)
- `frontend/src/lib/store.ts` — Zustand (token, userProfile w/ role, lang, theme)
- `frontend/src/lib/demo.ts` — in-browser demo API incl. auth + seller (Vercel standalone)
- `frontend/src/pages/` — RegisterPage (SIM), LoginPage, SellerAdminPage, AiBuyerPage, …
- `frontend/src/App.tsx` — routes + RequireAuth / RequireSeller guards

## RBAC
- Roles on `User.role` (buyer/seller); sellers manage only their own products.
- DRF TokenAuthentication; `api/permissions.py` → `IsSeller` gates the seller cabinet.
- Frontend guards in `App.tsx`; nav swaps Каталог→Магазин for sellers.

## Preview vs real mode
- **Preview** (`store.preview`, entered from the landing, no account): forces the
  in-browser demo API (`forceDemoMode`) + the scripted LiveActivity/friend-sim — this
  is the old "everything is simulated" experience.
- **Real** (logged in): real joins (Membership), and **real notifications** via
  `lib/useRealNotifications.ts` polling `/me/groups` + Web Notifications; no scripted sim.

## External product search
- When the AI buyer finds nothing in the DB, `services/external_search.py` pulls a real
  product from SerpApi Google Shopping (`SERPAPI_KEY`), persists it, and forms a group.

## Config
- Everything tunable is in env — `backend/.env(.example)` and `frontend/.env(.example)`.
  See SETUP.md §8 for the full table. Backend loads `.env` via python-dotenv.

## Live updates
ProductPage/JoinPage poll their group every 3s — a join on one device shows up
on the other (members tick up + price-drop flash). This powers the two-phone demo.

## Mock data
All in `backend/data/*.json`. 225 products, 8 groups, 5+ users.
Tags must match between users.interests and products.tags for recommender to work.
`frontend/src/data/*.json` is a bundled copy used by the in-browser demo API
(`frontend/src/lib/demo.ts`) — the frontend auto-falls back to it when the
backend is unreachable (this is how the Vercel deployment works standalone).
If you change backend data, re-copy it into frontend/src/data.

## The hero interaction
Join group button → optimistic +1 member → price animate-down → "You saved $X" state.
This is what the jury will remember. Keep it fast and satisfying.
