"""Django settings for the Birge / GroupBuy MVP.

Now ORM-backed (SQLite) to support real RBAC, SIM verification, a seller
cabinet, and the Django admin. Data is seeded from data/*.json via the
`seed_demo` management command.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env if present (see .env.example). Everything configurable lives
# in env vars so nothing sensitive/tunable is hard-coded.
load_dotenv(BASE_DIR / ".env")


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-birge-secret-not-for-production")
DEBUG = _env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "groupbuy.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "groupbuy.wsgi.application"
ASGI_APPLICATION = "groupbuy.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "api.User"

LANGUAGE_CODE = "ru"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Two-phone LAN demo: allow any origin so both devices reach the API.
CORS_ALLOW_ALL_ORIGINS = _env_bool("CORS_ALLOW_ALL_ORIGINS", True)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    # Endpoints opt into stricter permissions individually (seller cabinet etc.).
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "api.exceptions.envelope_exception_handler",
}

# --- AI buyer (Google Gemini) -------------------------------------------------
# Set GEMINI_API_KEY in the environment to enable the real LLM. Without it, the
# AI buyer falls back to the deterministic rule-based matcher (still works).
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# --- External product search (real web parsing when DB has no match) ----------
# Uses SerpApi Google Shopping. Set SERPAPI_KEY to enable; otherwise the AI
# buyer just replies "not found" instead of inventing a product.
EXTERNAL_SEARCH_ENABLED = _env_bool("EXTERNAL_SEARCH_ENABLED", True)
SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")
SERPAPI_GL = os.environ.get("SERPAPI_GL", "kz")
SERPAPI_HL = os.environ.get("SERPAPI_HL", "ru")

# Currency conversion used by the AI buyer + external search (KZT shown to users,
# USD stored internally to match the seed catalog).
KZT_PER_USD = float(os.environ.get("KZT_PER_USD", "450"))

# --- SIM / eSIM OTP -----------------------------------------------------------
SIM_CODE_TTL_MINUTES = int(os.environ.get("SIM_CODE_TTL_MINUTES", "10"))
# Min seconds between OTP requests for the same number (anti-spam).
SIM_RESEND_COOLDOWN_SECONDS = int(os.environ.get("SIM_RESEND_COOLDOWN_SECONDS", "30"))
# Surface the generated code in API responses while DEBUG is on (no SMS gateway).
SIM_RETURN_CODE_IN_RESPONSE = _env_bool("SIM_RETURN_CODE_IN_RESPONSE", DEBUG)

# --- SMS gateway (real SIM OTP delivery) --------------------------------------
# console (dev, prints code) | twilio | mobizon | smsc
SMS_PROVIDER = os.environ.get("SMS_PROVIDER", "console")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_FROM", "")
MOBIZON_API_KEY = os.environ.get("MOBIZON_API_KEY", "")
MOBIZON_API_URL = os.environ.get("MOBIZON_API_URL", "https://api.mobizon.kz")
SMSC_LOGIN = os.environ.get("SMSC_LOGIN", "")
SMSC_PASSWORD = os.environ.get("SMSC_PASSWORD", "")

# --- Seed accounts (override the demo credentials via env if you want) ---------
SEED_DEMO_PASSWORD = os.environ.get("SEED_DEMO_PASSWORD", "birge123")
SEED_ADMIN_USERNAME = os.environ.get("SEED_ADMIN_USERNAME", "admin")
SEED_ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "admin123")
