from fastapi import APIRouter, HTTPException

from models.schemas import ApiResponse, Group, GroupDetail, JoinGroupRequest, JoinGroupResponse
from routers.repository import load_groups, load_products, load_users, save_groups
from services.group_pricing import calculate_group_price
from services.group_status import is_group_joinable, with_effective_status


router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=ApiResponse[list[Group]])
def list_groups() -> ApiResponse[list[Group]]:
    groups = [
        group
        for group in (with_effective_status(item) for item in load_groups())
        if group.status in {"active", "completed"}
    ]
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
    return ApiResponse(data=GroupDetail(group=with_effective_status(group), product=product), success=True, message="Group loaded")


@router.post("/{group_id}/join", response_model=ApiResponse[JoinGroupResponse])
def join_group(group_id: str, payload: JoinGroupRequest) -> ApiResponse[JoinGroupResponse]:
    groups = load_groups()
    products = load_products()
    index = next((idx for idx, item in enumerate(groups) if item.id == group_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Group not found")

    group = groups[index]
    effective_group = with_effective_status(group)
    product = next((item for item in products if item.id == group.product_id), None)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found for group")

    user = next((item for item in load_users() if item.id == payload.user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if effective_group.status == "expired":
        raise HTTPException(status_code=409, detail="Group has expired")
    if not is_group_joinable(effective_group):
        raise HTTPException(status_code=409, detail="Group is already completed")

    next_members = min(effective_group.current_members + 1, effective_group.threshold)
    new_price = calculate_group_price(product, next_members)
    status = "completed" if next_members >= effective_group.threshold else "active"
    updated = group.model_copy(update={"current_members": next_members, "price_current": new_price, "status": status})
    groups[index] = updated
    save_groups(groups)
    savings_pct = round((1 - new_price / product.price_individual) * 100, 1)
    data = JoinGroupResponse(group=updated, new_price=new_price, savings_pct=savings_pct)
    return ApiResponse(data=data, success=True, message="Joined group and recalculated price")
