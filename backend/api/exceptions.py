"""Wrap every error in the same ``ApiResponse`` envelope used for success.

This keeps parity with the original FastAPI global exception handlers so the
frontend never sees a response shape it can't parse.
"""
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def envelope_exception_handler(exc, context) -> Response:
    response = drf_exception_handler(exc, context)
    if response is not None:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail:
            message = str(detail["detail"])
        else:
            message = str(detail)
        response.data = {
            "data": None,
            "success": False,
            "message": message,
            "code": response.status_code,
        }
        return response

    # Unhandled exception — surface it as a 500 in the same envelope.
    return Response(
        {"data": None, "success": False, "message": str(exc), "code": 500},
        status=500,
    )
