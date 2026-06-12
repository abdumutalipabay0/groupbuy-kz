"""Database models — the app now uses the Django ORM (SQLite) as the source of
truth, which is what makes the Django admin and real RBAC possible.

Product/Group keep CharField primary keys so the seeded demo data ("p001",
"g001", ...) and the frontend routes that reference those ids keep working.
"""
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


def make_id(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:8]}"


class User(AbstractUser):
    """RBAC user. `role` separates buyers from sellers; Django superusers are
    the platform admins via /admin/. SIM/eSIM fields back the verification flow.
    """

    class Role(models.TextChoices):
        BUYER = "buyer", "Покупатель"
        SELLER = "seller", "Продавец"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    sim_verified = models.BooleanField(default=False)
    sim_id = models.CharField(max_length=64, blank=True)  # mock eSIM identifier

    name = models.CharField(max_length=120, blank=True)
    city = models.CharField(max_length=80, default="Almaty")
    age = models.PositiveIntegerField(default=18)
    interests = models.JSONField(default=list, blank=True)
    budget_usd = models.PositiveIntegerField(default=100)
    currency_preference = models.CharField(max_length=4, default="KZT")
    language = models.CharField(max_length=4, default="ru")

    # seller-only
    shop_name = models.CharField(max_length=120, blank=True)

    @property
    def is_seller(self) -> bool:
        return self.role == self.Role.SELLER

    def __str__(self) -> str:
        return f"{self.name or self.username} ({self.role})"


class Product(models.Model):
    id = models.CharField(primary_key=True, max_length=24)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    marketplace = models.CharField(max_length=40, default="AliExpress")
    category = models.CharField(max_length=40, default="Electronics")
    tags = models.JSONField(default=list, blank=True)
    price_individual = models.FloatField()
    price_group_min = models.FloatField()
    group_threshold = models.PositiveIntegerField(default=10)
    image_url = models.CharField(max_length=600, blank=True)
    rating = models.FloatField(default=4.5)
    origin_country = models.CharField(max_length=60, default="China")
    source_id = models.CharField(max_length=120, blank=True, null=True)
    source_url = models.CharField(max_length=600, blank=True, null=True)
    source_price = models.FloatField(blank=True, null=True)
    source_currency = models.CharField(max_length=12, blank=True, null=True)
    source_location = models.CharField(max_length=120, blank=True, null=True)

    seller = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE, related_name="products"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.id} · {self.name}"


class Group(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Активна"
        COMPLETED = "completed", "Собрана"
        EXPIRED = "expired", "Истекла"

    id = models.CharField(primary_key=True, max_length=24)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="groups")
    current_members = models.PositiveIntegerField(default=0)
    threshold = models.PositiveIntegerField(default=10)
    price_current = models.FloatField()
    price_individual = models.FloatField()
    # ISO-8601 string, e.g. "2026-06-12T18:00:00+06:00" — kept as text so the
    # frontend countdown receives byte-identical values to the original data.
    expires_at = models.CharField(max_length=40)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    def __str__(self) -> str:
        return f"{self.id} · {self.product_id} ({self.current_members}/{self.threshold})"


class Membership(models.Model):
    """One row per (user, group) join — enforces "1 verified SIM = 1 seat"."""

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("group", "user")


class SimVerification(models.Model):
    """Mock SIM/eSIM OTP. A real deployment swaps the code generation for an
    SMS/telecom gateway; the verify step and "1 SIM = 1 account" stay the same.
    """

    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
