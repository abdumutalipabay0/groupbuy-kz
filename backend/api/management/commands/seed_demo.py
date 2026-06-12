"""Seed the database from data/*.json plus the demo accounts.

Run:  python manage.py seed_demo
Idempotent — clears catalog/groups and re-seeds; recreates the demo accounts.

Creates:
  - the full product/group catalog from data/*.json
  - the original mock users (u001..) as buyer accounts (password "birge123")
  - a buyer test account   +7 700 000 0001 / birge123
  - a seller test account  +7 700 000 0002 / birge123  (with 2 own products)
  - a Django admin (superuser)  admin / admin123
"""
import json

from django.conf import settings
from django.core.management.base import BaseCommand

from api.models import Group, Membership, Product, SimVerification, User
from api.services.group_pricing import calculate_group_price

DATA = settings.BASE_DIR / "data"
DEMO_PASSWORD = settings.SEED_DEMO_PASSWORD


def _read(name):
    with (DATA / name).open("r", encoding="utf-8") as handle:
        return json.load(handle)


class Command(BaseCommand):
    help = "Seed Birge demo data (catalog, groups, test accounts, admin)."

    def handle(self, *args, **options):
        # 1. wipe domain data (keep superusers if they already exist)
        Membership.objects.all().delete()
        Group.objects.all().delete()
        Product.objects.all().delete()
        SimVerification.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        # 2. catalog
        products = _read("products.json")
        Product.objects.bulk_create(
            [
                Product(
                    id=p["id"],
                    name=p["name"],
                    description=p.get("description", ""),
                    marketplace=p.get("marketplace", "AliExpress"),
                    category=p.get("category", "Electronics"),
                    tags=p.get("tags", []),
                    price_individual=p["price_individual"],
                    price_group_min=p["price_group_min"],
                    group_threshold=p["group_threshold"],
                    image_url=p.get("image_url", ""),
                    rating=p.get("rating", 4.5),
                    origin_country=p.get("origin_country", "China"),
                    source_id=p.get("source_id"),
                    source_url=p.get("source_url"),
                    source_price=p.get("source_price"),
                    source_currency=p.get("source_currency"),
                    source_location=p.get("source_location"),
                    is_active=True,
                )
                for p in products
            ]
        )

        groups = _read("groups.json")
        Group.objects.bulk_create(
            [
                Group(
                    id=g["id"],
                    product_id=g["product_id"],
                    current_members=g["current_members"],
                    threshold=g["threshold"],
                    price_current=g["price_current"],
                    price_individual=g["price_individual"],
                    expires_at=g["expires_at"],
                    status=g["status"],
                )
                for g in groups
            ]
        )

        # 3. original mock users -> buyer accounts
        for u in _read("users.json"):
            user = User(
                username=u["id"],
                role=User.Role.BUYER,
                name=u.get("name", ""),
                city=u.get("city", "Almaty"),
                age=u.get("age", 24),
                interests=u.get("interests", []),
                budget_usd=u.get("budget_usd", 100),
                currency_preference=u.get("currency_preference", "KZT"),
                language=u.get("language", "ru"),
                sim_verified=u.get("sim_verified", True),
            )
            user.set_password(DEMO_PASSWORD)
            user.save()

        # 4. explicit test accounts
        buyer = User(
            username="+77000000001",
            phone="+77000000001",
            role=User.Role.BUYER,
            sim_verified=True,
            sim_id="esim-77000000001",
            name="Аружан (тест)",
            city="Almaty",
            age=24,
            interests=["gaming", "electronics", "gadgets"],
            budget_usd=120,
            currency_preference="KZT",
            language="ru",
        )
        buyer.set_password(DEMO_PASSWORD)
        buyer.save()

        seller = User(
            username="+77000000002",
            phone="+77000000002",
            role=User.Role.SELLER,
            sim_verified=True,
            sim_id="esim-77000000002",
            name="Тимур (тест)",
            city="Astana",
            shop_name="TechStore KZ",
            currency_preference="KZT",
            language="ru",
        )
        seller.set_password(DEMO_PASSWORD)
        seller.save()

        # 5. seller-owned products + starter groups
        seller_catalog = [
            {
                "id": "ps001",
                "name": "Anker PowerBank 20000 mAh",
                "description": "Power bank with 65W USB-C PD, charges a laptop and two phones.",
                "category": "Electronics",
                "tags": ["electronics", "gadgets", "travel"],
                "price_individual": 49.0,
                "price_group_min": 35.0,
                "group_threshold": 8,
                "rating": 4.7,
                "image_url": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop&q=80",
            },
            {
                "id": "ps002",
                "name": "Xiaomi Smart Band 9",
                "description": "AMOLED fitness band, 21-day battery, 150+ workout modes.",
                "category": "Electronics",
                "tags": ["electronics", "sports", "gadgets"],
                "price_individual": 45.0,
                "price_group_min": 33.0,
                "group_threshold": 10,
                "rating": 4.6,
                "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=600&fit=crop&q=80",
            },
        ]
        from datetime import datetime, timedelta, timezone as tz

        for item in seller_catalog:
            product = Product.objects.create(
                id=item["id"],
                seller=seller,
                is_active=True,
                marketplace="AliExpress",
                origin_country="China",
                **{k: v for k, v in item.items() if k != "id"},
            )
            members = max(1, product.group_threshold // 3)
            Group.objects.create(
                id=f"g{item['id']}",
                product=product,
                current_members=members,
                threshold=product.group_threshold,
                price_current=calculate_group_price(
                    {
                        "price_individual": product.price_individual,
                        "price_group_min": product.price_group_min,
                        "group_threshold": product.group_threshold,
                    },
                    members,
                ),
                price_individual=product.price_individual,
                expires_at=(datetime.now(tz.utc) + timedelta(hours=48)).isoformat(),
                status="active",
            )

        # 6. Django admin superuser
        admin_username = settings.SEED_ADMIN_USERNAME
        if not User.objects.filter(username=admin_username).exists():
            User.objects.create_superuser(
                username=admin_username,
                password=settings.SEED_ADMIN_PASSWORD,
                email="admin@birge.kz",
                role=User.Role.SELLER,
                name="Admin",
            )

        self.stdout.write(self.style.SUCCESS("Seeded Birge demo data."))
        self.stdout.write(f"  Buyer:  +77000000001 / {DEMO_PASSWORD}")
        self.stdout.write(f"  Seller: +77000000002 / {DEMO_PASSWORD}")
        self.stdout.write(f"  Admin:  {admin_username} / {settings.SEED_ADMIN_PASSWORD}  (/admin/)")
