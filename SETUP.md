# Birge — что нужно от тебя, чтобы всё заработало

Коротко: поставить зависимости, создать БД с тестовыми данными, (опционально)
вставить ключ Gemini. Всё остальное уже готово.

---

## 1. Backend (Django + БД + админка)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate                 # macOS/Linux: source .venv/bin/activate
pip install "django>=5.0,<6.0" "djangorestframework>=3.15" "django-cors-headers>=4.4" "requests>=2.31"

python manage.py migrate               # создаёт SQLite-базу
python manage.py seed_demo             # ← ОБЯЗАТЕЛЬНО: каталог + тест-аккаунты + админ
python manage.py runserver 127.0.0.1:8000
```

> `seed_demo` можно запускать сколько угодно — он пересоздаёт демо-данные начисто.
> Если нужен свой пароль для админки: `python manage.py createsuperuser`.

## 2. Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev                            # http://127.0.0.1:5173
```

---

## 3. Ключи API — что нужно от тебя (всё через `.env`)

Скопируй `backend/.env.example` → `backend/.env` и заполни. Всё опционально:
без ключей приложение работает (AI — на правилах, поиск в интернете — выключен).

### 3.1 Gemini (настоящий AI-байер)
1. Бесплатный ключ: **https://aistudio.google.com/apikey**
2. В `backend/.env`:
   ```env
   GEMINI_API_KEY=AIza...твой_ключ
   GEMINI_MODEL=gemini-2.0-flash
   ```
**Где читается:** `settings.py` → `GEMINI_API_KEY`. Логика: `services/ai_buyer.py` → `gemini_select()`.
Ответ AI содержит `"ai": "gemini" | "rules"` — видно, что реально сработало.

### 3.2 Парсинг товаров из интернета (SerpApi)
Когда товара нет в нашей БД, AI-байер **подтягивает реальный товар с веба** (Google
Shopping через SerpApi), добавляет его в каталог и создаёт под него группу.
1. Ключ (есть бесплатный тариф): **https://serpapi.com**
2. В `backend/.env`:
   ```env
   SERPAPI_KEY=твой_serpapi_ключ
   EXTERNAL_SEARCH_ENABLED=true
   SERPAPI_GL=kz
   SERPAPI_HL=ru
   ```
**Где читается:** `settings.py` → `SERPAPI_*`. Логика: `services/external_search.py`.
Без ключа AI просто скажет «не нашёл». Ответ AI содержит `"from_internet": true`, если товар взят с веба.

### 3.3 SMS-шлюз (реальный SIM/eSIM — настоящая отправка кода)
По умолчанию `SMS_PROVIDER=console`: код печатается в консоль и показывается в форме
(dev). Для **настоящей отправки SMS** на номер выбери провайдера в `backend/.env`:
```env
# Twilio:
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1...

# или Mobizon (Казахстан):
SMS_PROVIDER=mobizon
MOBIZON_API_KEY=...

# или SMSC.kz:
SMS_PROVIDER=smsc
SMSC_LOGIN=...
SMSC_PASSWORD=...
```
При настроенном провайдере код реально уходит по SMS и **не** возвращается в ответе
(если `DJANGO_DEBUG=false`). Логика: `backend/api/services/sms.py`. Есть анти-спам:
повторный код можно запросить не чаще `SIM_RESEND_COOLDOWN_SECONDS` (30с). Вход по
SMS-коду работает для существующих номеров (`purpose=login`), регистрация — для новых.

### 3.4 Альтернатива переменным окружения
Можно не использовать `.env`, а задать переменные в шелле перед `runserver`:
```powershell
$env:GEMINI_API_KEY = "AIza..."; $env:SERPAPI_KEY = "..."; python manage.py runserver 127.0.0.1:8000
```

---

## 4. Тестовые аккаунты

| Роль | Телефон | Пароль | Где |
|------|---------|--------|-----|
| 🛒 Покупатель | `+7 700 000 0001` | `birge123` | вход в приложении (вкладка «Войти») |
| 🏪 Продавец | `+7 700 000 0002` | `birge123` | вход → попадает в «Кабинет продавца» |
| 🔧 Админ (Django) | `admin` | `admin123` | **http://127.0.0.1:8000/admin/** |

Регистрация новых пользователей — через **SIM/eSIM**: вводишь номер Казахстана
(`+7 7XX...`, форматируется на лету), жмёшь «Код», в дев-режиме код показывается
прямо в форме (в проде он уйдёт по SMS — см. ниже). 1 номер = 1 аккаунт.

**Превью без входа:** на лендинге есть «Посмотреть демо без входа» — гость заходит
в приложение на демо-данных (в браузере, без аккаунта), со скриптовой «движухой»
(всплывашки активности, симуляция друзей). Реальные аккаунты получают вместо этого
**настоящие уведомления** (когда в твою команду реально кто-то вступает или она
собирается) и реальный набор в группу.

---

## 5. Что мок / что настоящее

| Фича | Статус |
|------|--------|
| RBAC покупатель/продавец | ✅ настоящий (Django + DRF token) |
| Django-админка | ✅ настоящая, реальная БД |
| SIM/eSIM проверка | ⚠️ OTP-код **в дев-режиме показывается в UI**. Для прода подключи SMS-шлюз в `backend/api/services/sim.py` → `request_code()` (сейчас код просто генерируется; добавь отправку через провайдера). Формат номера и «1 SIM = 1 аккаунт» уже работают. |
| AI-байер | ✅ настоящий Gemini при наличии ключа, иначе rule-based fallback |
| Парсинг товаров с веба | ✅ SerpApi Google Shopping (при `SERPAPI_KEY`); найденный товар сохраняется в БД |
| Реальный набор в команду | ✅ вступление через invite-ссылку, membership в БD (1 SIM = 1 место) |
| Уведомления | ✅ настоящие: опрос твоих команд + браузерные Web Notifications (для залогиненных). Скриптовые «всплывашки» — только в превью |
| Превью-режим | ✅ демо с лендинга без входа (in-browser данные, симуляция) |
| Кабинет продавца (добавить/удалить товар) | ✅ настоящий, пишет в БД, к новому товару сразу создаётся группа |
| Оплата | ❌ не реализована (по ТЗ — этап Vision) |

---

## 6. Деплой на Vercel (фронт)

Фронт умеет работать **без бэкенда**: если API недоступен, включается встроенный
demo-режим (`frontend/src/lib/demo.ts`) — регистрация по SIM, вход, кабинет
продавца, AI и группы работают на mock-данных в браузере. Тестовые аккаунты те же.
Для реального бэкенда задай `VITE_API_URL` в настройках проекта Vercel.

## 7. Демо с двух телефонов (live-цена)

Запусти бэкенд и фронт, в `frontend/.env.local` укажи `VITE_API_URL=http://<LAN-IP>:8000`.
Оба телефона открывают один товар → когда один вступает в группу, у второго
цена падает в реальном времени (опрос раз в 3 сек) + приходит уведомление.

## 8. Все переменные окружения (вынесено в env)

**Backend** (`backend/.env`, см. `backend/.env.example`):

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `DJANGO_SECRET_KEY` | dev-ключ | секрет Django |
| `DJANGO_DEBUG` | true | режим отладки |
| `DJANGO_ALLOWED_HOSTS` | `*` | разрешённые хосты (через запятую) |
| `CORS_ALLOW_ALL_ORIGINS` | true | CORS |
| `GEMINI_API_KEY` | — | ключ Gemini (AI-байер) |
| `GEMINI_MODEL` | gemini-2.0-flash | модель Gemini |
| `SERPAPI_KEY` | — | ключ SerpApi (парсинг с веба) |
| `EXTERNAL_SEARCH_ENABLED` | true | вкл/выкл веб-поиск |
| `SERPAPI_GL` / `SERPAPI_HL` | kz / ru | страна/язык поиска |
| `KZT_PER_USD` | 450 | курс для цен |
| `SIM_CODE_TTL_MINUTES` | 10 | срок жизни OTP-кода |
| `SIM_RESEND_COOLDOWN_SECONDS` | 30 | анти-спам: пауза между запросами кода |
| `SIM_RETURN_CODE_IN_RESPONSE` | =DEBUG | показывать код в ответе (дев) |
| `SMS_PROVIDER` | console | console / twilio / mobizon / smsc |
| `TWILIO_*` / `MOBIZON_*` / `SMSC_*` | — | креды SMS-провайдера |
| `SEED_DEMO_PASSWORD` | birge123 | пароль тест-аккаунтов |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` | admin / admin123 | админ |

**Frontend** (`frontend/.env.local`, см. `frontend/.env.example`):

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `VITE_API_URL` | http://127.0.0.1:8000 | адрес бэкенда |
| `VITE_KZT_PER_USD` / `VITE_RUB_PER_USD` | 450 / 90 | курсы для отображения |
| `VITE_GROUP_POLL_MS` | 3000 | опрос цены/группы (live) |
| `VITE_NOTIFY_POLL_MS` | 8000 | опрос уведомлений |
