from rest_framework.permissions import BasePermission


class IsSeller(BasePermission):
    message = "Доступно только продавцам"

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "seller"
        )
