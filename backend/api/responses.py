"""The single response envelope shared by every endpoint.

Mirrors the original FastAPI ``ApiResponse[T]`` shape so the existing frontend
client (which checks ``success`` and ``data``) keeps working unchanged.
"""
from typing import Any

from rest_framework.response import Response


def ok(data: Any, message: str, status: int = 200) -> Response:
    return Response(
        {"data": data, "success": True, "message": message, "code": None},
        status=status,
    )


def fail(message: str, status: int) -> Response:
    return Response(
        {"data": None, "success": False, "message": message, "code": status},
        status=status,
    )
