"""Linear price interpolation between the individual and floor group price."""


def calculate_group_price(product: dict, current_members: int) -> float:
    threshold = product["group_threshold"]
    progress = min(max(current_members, 0), threshold) / threshold
    discount = product["price_individual"] - product["price_group_min"]
    price = product["price_individual"] - discount * progress
    return round(max(price, product["price_group_min"]), 2)
