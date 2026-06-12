"""Tag-intersection scoring with budget and city nudges."""

CITY_POPULAR: dict[str, list[str]] = {
    "Almaty": ["electronics", "fashion", "beauty", "sports"],
    "Astana": ["electronics", "home", "fashion"],
    "Shymkent": ["fashion", "home", "food"],
}


def group_success_probability(members: int, threshold: int, hours_left: float) -> float:
    ratio = min(members / max(threshold, 1), 1.0)
    time_factor = min(hours_left / 48, 1.0) * 0.15
    return min(0.96, round(ratio * 0.72 + time_factor + 0.10, 2))


def recommend(user: dict, products: list[dict], limit: int = 10) -> list[dict]:
    user_tags = set(user["interests"])
    city_tags = set(CITY_POPULAR.get(user["city"], []))

    if not user_tags:
        return sorted(products, key=lambda item: item["rating"], reverse=True)[:limit]

    def score(product: dict) -> float:
        tag_set = set(product["tags"])
        overlap = len(user_tags & tag_set) / len(user_tags) if user_tags else 0
        budget_bonus = 1.5 if product["price_individual"] <= user["budget_usd"] else 0.8
        city_bonus = 1.2 if city_tags & tag_set else 1.0
        return overlap * budget_bonus * city_bonus + product["rating"] * 0.05

    return sorted(products, key=score, reverse=True)[:limit]
