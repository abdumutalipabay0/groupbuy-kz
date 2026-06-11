import base64
import json
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, HTTPException

from models.schemas import ApiResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User
from routers.repository import load_users, make_id, save_users


router = APIRouter(prefix="/auth", tags=["auth"])


def _mock_jwt(user: User) -> str:
    header = {"alg": "none", "typ": "JWT"}
    payload = {
        "sub": user.id,
        "name": user.name,
        "sim_verified": user.sim_verified,
        "sim_claim": f"mock-esim-{user.id}",
        "exp": int((datetime.now(UTC) + timedelta(days=7)).timestamp()),
    }

    def encode(part: dict[str, object]) -> str:
        raw = json.dumps(part, separators=(",", ":")).encode()
        return base64.urlsafe_b64encode(raw).decode().rstrip("=")

    return f"{encode(header)}.{encode(payload)}."


@router.post("/register", response_model=ApiResponse[RegisterResponse])
def register(payload: RegisterRequest) -> ApiResponse[RegisterResponse]:
    users = load_users()
    user = User(id=make_id("u"), sim_verified=True, **payload.model_dump())
    users.append(user)
    save_users(users)
    data = RegisterResponse(user_id=user.id, token=_mock_jwt(user), sim_verified=True)
    return ApiResponse(data=data, success=True, message="Registered with mock SIM/eSIM verification")


@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(payload: LoginRequest) -> ApiResponse[LoginResponse]:
    user = next((item for item in load_users() if item.id == payload.user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(data=LoginResponse(token=_mock_jwt(user)), success=True, message="Logged in")
