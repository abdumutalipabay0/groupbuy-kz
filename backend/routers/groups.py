from fastapi import APIRouter, HTTPException

from models.schemas import ApiResponse, Group, GroupDetail, JoinGroupRequest, JoinGroupResponse
from routers.repository import load_groups, load_products, save_groups
from services.group_pricing import calculate_group_price


router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=ApiResponse[list[Group]])
def list_groups() -> ApiResponse[list[Group]]:
    groups = [item for item in load_groups() if item.status in {"active", "completed"}]
    return ApiResponse(data=groups, success=True, message="Groups loaded")


@router.get("/{group_id}", response_model=ApiResponse[GroupDetail])
def get_group(group_id: str) -> ApiResponse[GroupDetail]:
    groups = load_groups()
    products = load_products()
    group = next((item for item in groups if item.id == group_id), None)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    product = next((item for item in products if item.id == group.product_id), None)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found for group")
    return ApiResponse(data=GroupDetail(group=group, product=product), success=True, message="Group loaded")


@router.post("/{group_id}/join", response_model=ApiResponse[JoinGroupResponse])
def join_group(group_id: str, _: JoinGroupRequest) -> ApiResponse[JoinGroupResponse]:
    groups = load_groups()
    products = load_products()
    index = next((idx for idx, item in enumerate(groups) if item.id == group_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Group not found")

    group = groups[index]
    product = next((item for item in products if item.id == group.product_id), None)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found for group")

    if group.status == "expired":
        raise HTTPException(status_code=409, detail="Group has expired")

    next_members = min(group.current_members + 1, group.threshold)
    new_price = calculate_group_price(product, next_members)
    status = "completed" if next_members >= group.threshold else "active"
    updated = group.model_copy(update={"current_members": next_members, "price_current": new_price, "status": status})
    groups[index] = updated
    save_groups(groups)
    savings_pct = round((1 - new_price / product.price_individual) * 100, 1)
    data = JoinGroupResponse(group=updated, new_price=new_price, savings_pct=savings_pct)
    return ApiResponse(data=data, success=True, message="Joined group and recalculated price")
