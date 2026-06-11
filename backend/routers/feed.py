from fastapi import APIRouter, HTTPException, Query

from models.schemas import ApiResponse, Product
from routers.repository import load_products, load_users
from services.recommender import recommend


router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=ApiResponse[list[Product]])
def get_feed(user_id: str, limit: int = Query(default=20, ge=1, le=50)) -> ApiResponse[list[Product]]:
    user = next((item for item in load_users() if item.id == user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(data=recommend(user, load_products(), limit), success=True, message="Deal feed loaded")
