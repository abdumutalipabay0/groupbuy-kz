"""Effective group status — an ``active`` group past its deadline reads as expired."""
from datetime import datetime, timezone


def is_group_expired(group: dict, now: datetime | None = None) -> bool:
    if group["status"] != "active":
        return group["status"] == "expired"

    try:
        expires_at = datetime.fromisoformat(group["expires_at"])
    except ValueError:
        return False

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    current_time = now or datetime.now(timezone.utc)
    return expires_at.astimezone(timezone.utc) <= current_time.astimezone(timezone.utc)


def with_effective_status(group: dict, now: datetime | None = None) -> dict:
    if is_group_expired(group, now):
        return {**group, "status": "expired"}
    return group


def is_group_joinable(group: dict, now: datetime | None = None) -> bool:
    effective = with_effective_status(group, now)
    return effective["status"] == "active" and effective["current_members"] < effective["threshold"]
