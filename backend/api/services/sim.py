"""Mock SIM/eSIM identity for Kazakhstan.

Concept (per the spec): 1 verified SIM = 1 person = 1 account. There is no
public KZ telecom API, so this is an OTP-by-code stand-in:
  request_code -> generate + store a 6-digit code (an SMS gateway would send it)
  is_code_valid -> check the latest unexpired code for that phone

`normalize_kz_phone` accepts +7 / 8 / 7 forms of a KZ mobile number and returns
the canonical "+77XXXXXXXXX", or None if it isn't a valid KZ mobile.
"""
import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from api.models import SimVerification


def normalize_kz_phone(raw: str | None) -> str | None:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    if len(digits) == 10 and digits.startswith("7"):  # missing country prefix
        digits = "7" + digits
    # KZ mobile numbers: country code 7, operator block 7XX -> starts with "77".
    if len(digits) == 11 and digits.startswith("77"):
        return "+" + digits
    return None


def seconds_since_last(phone: str) -> float | None:
    last = SimVerification.objects.filter(phone=phone).order_by("-created_at").first()
    if last is None:
        return None
    return (timezone.now() - last.created_at).total_seconds()


def request_code(phone: str) -> str:
    code = f"{secrets.randbelow(1_000_000):06d}"
    SimVerification.objects.create(phone=phone, code=code, verified=False)
    return code


def is_code_valid(phone: str, code: str) -> bool:
    cutoff = timezone.now() - timedelta(minutes=settings.SIM_CODE_TTL_MINUTES)
    record = (
        SimVerification.objects.filter(phone=phone, code=(code or "").strip(), created_at__gte=cutoff)
        .order_by("-created_at")
        .first()
    )
    if record is None:
        return False
    record.verified = True
    record.save(update_fields=["verified"])
    return True


def sim_id_for(phone: str) -> str:
    return f"esim-{re.sub(r'[^0-9]', '', phone)}"
