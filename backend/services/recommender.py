from models.schemas import Product, User


def recommend(user: User, products: list[Product], limit: int = 10) -> list[Product]:
    user_tags = set(user.interests)
    if not user_tags:
        return sorted(products, key=lambda item: item.rating, reverse=True)[:limit]

    def score(product: Product) -> tuple[float, float]:
        overlap = len(user_tags.intersection(product.tags)) / len(user_tags)
        budget_bonus = 1.5 if product.price_individual <= user.budget_usd else 0.8
        return (overlap * budget_bonus, product.rating)

    return sorted(products, key=score, reverse=True)[:limit]
