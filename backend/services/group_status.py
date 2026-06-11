from datetime import UTC, datetime

from models.schemas import Group


def is_group_expired(group: Group, now: datetime | None = None) -> bool:
    if group.status != "active":
        return group.status == "expired"

    try:
        expires_at = datetime.fromisoformat(group.expires_at)
    except ValueError:
        return False

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)

    current_time = now or datetime.now(UTC)
    return expires_at.astimezone(UTC) <= current_time.astimezone(UTC)


def with_effective_status(group: Group, now: datetime | None = None) -> Group:
    if is_group_expired(group, now):
        return group.model_copy(update={"status": "expired"})
    return group


def is_group_joinable(group: Group, now: datetime | None = None) -> bool:
    effective = with_effective_status(group, now)
    return effective.status == "active" and effective.current_members < effective.threshold
