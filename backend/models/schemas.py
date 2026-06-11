from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, Field


Currency = Literal["KZT", "USD", "RUB"]
Language = Literal["ru", "en", "kz"]
Marketplace = Literal[
    "AliExpress",
    "Amazon",
    "Taobao",
    "Wildberries",
    "OpenFoodFacts",
    "OpenBeautyFacts",
    "OpenProductsFacts",
]
GroupStatus = Literal["active", "completed", "expired"]


class Product(BaseModel):
    id: str
    name: str
    description: str
    marketplace: Marketplace
    category: str
    tags: list[str]
    price_individual: float = Field(gt=0)
    price_group_min: float = Field(gt=0)
    group_threshold: int = Field(gt=0)
    image_url: str
    rating: float = Field(ge=0, le=5)
    origin_country: str
    source_id: str | None = None
    source_url: str | None = None
    source_price: float | None = None
    source_currency: str | None = None
    source_location: str | None = None


class Group(BaseModel):
    id: str
    product_id: str
    current_members: int = Field(ge=0)
    threshold: int = Field(gt=0)
    price_current: float = Field(gt=0)
    price_individual: float = Field(gt=0)
    expires_at: str
    status: GroupStatus


class User(BaseModel):
    id: str
    name: str
    city: str
    age: int = Field(ge=13, le=100)
    interests: list[str]
    budget_usd: int = Field(ge=1)
    sim_verified: bool = True
    currency_preference: Currency
    language: Language


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1)
    city: str
    age: int = Field(ge=13, le=100)
    budget_usd: int = Field(ge=10, le=1000)
    interests: list[str] = Field(min_length=1)
    currency_preference: Currency = "KZT"
    language: Language = "ru"


class RegisterResponse(BaseModel):
    user_id: str
    token: str
    sim_verified: bool


class LoginRequest(BaseModel):
    user_id: str


class LoginResponse(BaseModel):
    token: str


class ProductDetail(BaseModel):
    product: Product
    group: Group | None


class GroupDetail(BaseModel):
    group: Group
    product: Product


class JoinGroupRequest(BaseModel):
    user_id: str


class JoinGroupResponse(BaseModel):
    group: Group
    new_price: float
    savings_pct: float


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T | None = None
    success: bool
    message: str
    code: int | None = None
