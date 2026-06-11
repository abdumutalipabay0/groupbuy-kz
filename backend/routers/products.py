from fastapi import APIRouter, HTTPException, Query

from models.schemas import ApiResponse, Product, ProductDetail
from routers.repository import load_groups, load_products
from services.group_status import with_effective_status


router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ApiResponse[list[Product]])
def list_products(
    category: str | None = None,
    marketplace: str | None = None,
    max_price: float | None = Query(default=None, ge=0),
) -> ApiResponse[list[Product]]:
    products = load_products()
    if category:
        products = [item for item in products if item.category.lower() == category.lower()]
    if marketplace:
        products = [item for item in products if item.marketplace.lower() == marketplace.lower()]
    if max_price is not None:
        products = [item for item in products if item.price_individual <= max_price]
    return ApiResponse(data=products, success=True, message="Products loaded")


@router.get("/{product_id}", response_model=ApiResponse[ProductDetail])
def get_product(product_id: str) -> ApiResponse[ProductDetail]:
    product = next((item for item in load_products() if item.id == product_id), None)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    group = None
    for item in load_groups():
        if item.product_id != product_id:
            continue
        effective_group = with_effective_status(item)
        if effective_group.status == "active":
            group = effective_group
            break
    return ApiResponse(data=ProductDetail(product=product, group=group), success=True, message="Product loaded")
