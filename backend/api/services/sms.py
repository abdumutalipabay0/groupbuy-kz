"""SMS delivery for the SIM/eSIM OTP — the real path for "full SIM".

Pluggable provider via SMS_PROVIDER:
  console  — dev default: prints the code, returns False (not actually delivered)
  twilio   — Twilio REST API (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM)
  mobizon  — Mobizon.kz (popular in Kazakhstan; MOBIZON_API_KEY / MOBIZON_API_URL)
  smsc     — SMSC.kz / SMSC.ru (SMSC_LOGIN / SMSC_PASSWORD)

`send_sms` returns True only when a provider actually accepted the message, so the
caller knows whether it still needs to surface the code for local testing.
"""
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _send_twilio(phone: str, text: str) -> bool:
    import requests

    sid = settings.TWILIO_ACCOUNT_SID
    resp = requests.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
        auth=(sid, settings.TWILIO_AUTH_TOKEN),
        data={"From": settings.TWILIO_FROM, "To": phone, "Body": text},
        timeout=12,
    )
    resp.raise_for_status()
    return True


def _send_mobizon(phone: str, text: str) -> bool:
    import requests

    resp = requests.get(
        f"{settings.MOBIZON_API_URL}/service/message/sendSmsMessage",
        params={
            "apiKey": settings.MOBIZON_API_KEY,
            "recipient": phone.lstrip("+"),
            "text": text,
            "output": "json",
        },
        timeout=12,
    )
    resp.raise_for_status()
    return resp.json().get("code") == 0


def _send_smsc(phone: str, text: str) -> bool:
    import requests

    resp = requests.get(
        "https://smsc.kz/sys/send.php",
        params={
            "login": settings.SMSC_LOGIN,
            "psw": settings.SMSC_PASSWORD,
            "phones": phone.lstrip("+"),
            "mes": text,
            "fmt": 3,
        },
        timeout=12,
    )
    resp.raise_for_status()
    return "error" not in resp.json()


_PROVIDERS = {"twilio": _send_twilio, "mobizon": _send_mobizon, "smsc": _send_smsc}


def send_sms(phone: str, text: str) -> bool:
    """Deliver an SMS. Returns True if a real provider accepted it."""
    provider = (settings.SMS_PROVIDER or "console").lower()
    sender = _PROVIDERS.get(provider)
    if sender is None:
        logger.info("[SMS console] to %s: %s", phone, text)
        return False
    try:
        return bool(sender(phone, text))
    except Exception as exc:  # noqa: BLE001 — never let SMS break the flow
        logger.warning("SMS via %s failed: %s", provider, exc)
        return False
