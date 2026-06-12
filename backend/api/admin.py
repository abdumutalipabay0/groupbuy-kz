from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from api.models import Group, Membership, Product, SimVerification, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "name", "role", "phone", "sim_verified", "city", "is_staff")
    list_filter = ("role", "sim_verified", "is_staff", "city")
    search_fields = ("username", "name", "phone", "shop_name")
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Birge",
            {
                "fields": (
                    "role",
                    "phone",
                    "sim_verified",
                    "sim_id",
                    "name",
                    "city",
                    "age",
                    "interests",
                    "budget_usd",
                    "currency_preference",
                    "language",
                    "shop_name",
                )
            },
        ),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "marketplace", "price_individual", "seller", "is_active")
    list_filter = ("category", "marketplace", "is_active")
    search_fields = ("id", "name", "description")
    autocomplete_fields = ()


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "current_members", "threshold", "price_current", "status")
    list_filter = ("status",)
    search_fields = ("id", "product__id", "product__name")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("group", "user", "joined_at")
    search_fields = ("group__id", "user__username")


@admin.register(SimVerification)
class SimVerificationAdmin(admin.ModelAdmin):
    list_display = ("phone", "code", "verified", "created_at")
    list_filter = ("verified",)
    search_fields = ("phone",)
