"""Model -> plain-dict serializers.

The business-logic services (recommender, pricing, group_status) and the AI
buyer all operate on plain dicts, and the frontend expects an exact JSON shape.
Serializing here keeps every layer working on the same dict contract.
"""
from api.models import Group, Product, User


def product_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "marketplace": p.marketplace,
        "category": p.category,
        "tags": p.tags or [],
        "price_individual": p.price_individual,
        "price_group_min": p.price_group_min,
        "group_threshold": p.group_threshold,
        "image_url": p.image_url,
        "rating": p.rating,
        "origin_country": p.origin_country,
        "source_id": p.source_id,
        "source_url": p.source_url,
        "source_price": p.source_price,
        "source_currency": p.source_currency,
        "source_location": p.source_location,
    }


def group_dict(g: Group) -> dict:
    return {
        "id": g.id,
        "product_id": g.product_id,
        "current_members": g.current_members,
        "threshold": g.threshold,
        "price_current": g.price_current,
        "price_individual": g.price_individual,
        "expires_at": g.expires_at,
        "status": g.status,
    }


def user_dict(u: User) -> dict:
    return {
        "id": str(u.pk),
        "name": u.name or u.username,
        "city": u.city,
        "age": u.age,
        "interests": u.interests or [],
        "budget_usd": u.budget_usd,
        "sim_verified": u.sim_verified,
        "currency_preference": u.currency_preference,
        "language": u.language,
        "role": u.role,
        "phone": u.phone or "",
        "shop_name": u.shop_name or "",
    }
