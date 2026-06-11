import json
from pathlib import Path
from typing import Any, TypeVar
from uuid import uuid4

from models.schemas import Group, Product, User


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ModelT = TypeVar("ModelT", Product, Group, User)


def _read_json(name: str) -> Any:
    with (DATA_DIR / name).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_json(name: str, data: Any) -> None:
    with (DATA_DIR / name).open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)


def load_products() -> list[Product]:
    return [Product.model_validate(item) for item in _read_json("products.json")]


def save_products(products: list[Product]) -> None:
    _write_json("products.json", [item.model_dump() for item in products])


def load_groups() -> list[Group]:
    return [Group.model_validate(item) for item in _read_json("groups.json")]


def save_groups(groups: list[Group]) -> None:
    _write_json("groups.json", [item.model_dump() for item in groups])


def load_users() -> list[User]:
    return [User.model_validate(item) for item in _read_json("users.json")]


def save_users(users: list[User]) -> None:
    _write_json("users.json", [item.model_dump() for item in users])


def make_id(prefix: str) -> str:
    return f"{prefix}{uuid4().hex[:8]}"
