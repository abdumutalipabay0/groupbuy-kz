from django.urls import path

from api import views

urlpatterns = [
    path("", views.healthcheck),
    # auth + SIM/eSIM
    path("auth/sim/request", views.sim_request),
    path("auth/register", views.register),
    path("auth/login", views.login),
    path("auth/me", views.me),
    path("me/groups", views.my_groups),
    # products
    path("products", views.list_products),
    path("products/<str:product_id>", views.get_product),
    # feed + recommend
    path("feed", views.get_feed),
    path("recommend", views.get_recommendations),
    # ai buyer
    path("ai/buyer", views.ai_buyer),
    # groups
    path("groups", views.list_groups),
    path("groups/create", views.create_group),
    path("groups/<str:group_id>", views.get_group),
    path("groups/<str:group_id>/join", views.join_group),
    # seller cabinet
    path("seller/products", views.seller_products),
    path("seller/products/<str:product_id>", views.seller_product_detail),
]
