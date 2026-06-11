from models.schemas import Product


def calculate_group_price(product: Product, current_members: int) -> float:
    progress = min(max(current_members, 0), product.group_threshold) / product.group_threshold
    discount = product.price_individual - product.price_group_min
    price = product.price_individual - discount * progress
    return round(max(price, product.price_group_min), 2)
