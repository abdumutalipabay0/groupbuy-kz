"""All Birge / GroupBuy endpoints (DRF function views over the ORM).

Same ApiResponse envelope + same product/group/feed/AI paths as before, now
DB-backed with real RBAC (buyers vs sellers), SIM verification, a seller
product cabinet, and a Gemini-powered AI buyer.
"""
from datetime import datetime, timedelta, timezone

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from api.models import Group, Membership, Product, User, make_id
from api.permissions import IsSeller
from api.responses import fail, ok
from api.serialize import group_dict, product_dict, user_dict
from api.services import sim
from api.services.ai_buyer import build_candidates, build_reply, gemini_select, parse_query, pick_product
from api.services.external_search import search_external
from api.services.group_pricing import calculate_group_price
from api.services.group_status import is_group_joinable, with_effective_status
from api.services.recommender import recommend

CURRENCIES = {"KZT", "USD", "RUB"}
LANGUAGES = {"ru", "en", "kz"}


def _clamp_int(raw, default: int, low: int, high: int) -> int:
    if raw is None:
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, value))


def _resolve_user(request, fallback_user_id=None) -> User | None:
    """Authenticated user (token) takes priority; else a ?user_id / body id; else
    the first buyer (keeps anonymous browsing/feed working for the demo)."""
    if request.user and request.user.is_authenticated:
        return request.user
    if fallback_user_id:
        try:
            return User.objects.get(pk=int(fallback_user_id))
        except (User.DoesNotExist, ValueError, TypeError):
            user = User.objects.filter(username=str(fallback_user_id)).first()
            if user:
                return user
    return User.objects.filter(role=User.Role.BUYER).order_by("pk").first()


@api_view(["GET"])
def healthcheck(request):
    return ok({"status": "ok"}, "Birge API is running")


# ----------------------------------------------------------------------- auth


@api_view(["POST"])
def sim_request(request):
    from math import ceil

    from django.conf import settings

    from api.services.sms import send_sms

    payload = request.data or {}
    phone = sim.normalize_kz_phone(payload.get("phone"))
    if phone is None:
        return fail("Введите корректный номер Казахстана (+7 7XX XXX XX XX)", 400)

    # purpose=register (default) needs a NEW number; purpose=login needs an existing one.
    purpose = payload.get("purpose", "register")
    exists = User.objects.filter(phone=phone).exists()
    if purpose == "register" and exists:
        return fail("Этот номер уже зарегистрирован — войдите в аккаунт", 409)
    if purpose == "login" and not exists:
        return fail("Номер не найден — сначала зарегистрируйтесь", 404)

    # Anti-spam: throttle OTP requests per number.
    since = sim.seconds_since_last(phone)
    cooldown = settings.SIM_RESEND_COOLDOWN_SECONDS
    if since is not None and since < cooldown:
        return fail(f"Запросить новый код можно через {ceil(cooldown - since)} сек", 429)

    code = sim.request_code(phone)
    delivered = send_sms(phone, f"Birge: ваш код подтверждения {code}. Никому его не сообщайте.")
    data = {"phone": phone, "sent": True, "delivered": delivered}
    # Surface the code only when DEBUG asks for it, or when no real SMS went out
    # (so local/dev without a gateway still works).
    if settings.SIM_RETURN_CODE_IN_RESPONSE or not delivered:
        data["dev_code"] = code
    return ok(data, "Код отправлен на SIM/eSIM" if delivered else "Код сгенерирован (dev)")


@api_view(["POST"])
def register(request):
    payload = request.data or {}
    phone = sim.normalize_kz_phone(payload.get("phone"))
    if phone is None:
        return fail("Введите корректный номер Казахстана", 400)
    if not sim.is_code_valid(phone, payload.get("code", "")):
        return fail("Неверный или просроченный код подтверждения", 400)
    if User.objects.filter(phone=phone).exists():
        return fail("Этот номер уже зарегистрирован", 409)

    role = payload.get("role", "buyer")
    if role not in (User.Role.BUYER, User.Role.SELLER):
        return fail("Некорректная роль", 400)

    name = (payload.get("name") or "").strip()
    interests = payload.get("interests") or []
    currency = payload.get("currency_preference", "KZT")
    language = payload.get("language", "ru")
    if currency not in CURRENCIES:
        currency = "KZT"
    if language not in LANGUAGES:
        language = "ru"

    user = User(
        username=phone,
        phone=phone,
        role=role,
        sim_verified=True,
        sim_id=sim.sim_id_for(phone),
        name=name,
        city=payload.get("city", "Almaty"),
        age=_clamp_int(payload.get("age"), 24, 13, 100),
        interests=interests if isinstance(interests, list) else [],
        budget_usd=_clamp_int(payload.get("budget_usd"), 120, 10, 100000),
        currency_preference=currency,
        language=language,
        shop_name=(payload.get("shop_name") or "").strip(),
    )
    password = payload.get("password")
    if password:
        user.set_password(password)
    else:
        user.set_unusable_password()
    user.save()

    token, _ = Token.objects.get_or_create(user=user)
    return ok(
        {"token": token.key, "user": user_dict(user), "sim_verified": True},
        "Регистрация завершена с проверкой SIM/eSIM",
    )


@api_view(["POST"])
def login(request):
    payload = request.data or {}
    phone = sim.normalize_kz_phone(payload.get("phone"))
    if phone is None:
        return fail("Введите корректный номер Казахстана", 400)

    user = None
    if payload.get("password"):
        user = authenticate(username=phone, password=payload["password"])
    elif payload.get("code"):
        if sim.is_code_valid(phone, payload["code"]):
            user = User.objects.filter(phone=phone).first()
    else:
        return fail("Укажите пароль или код из SMS", 400)

    if user is None:
        return fail("Неверные данные для входа", 401)

    token, _ = Token.objects.get_or_create(user=user)
    return ok({"token": token.key, "user": user_dict(user)}, "Вход выполнен")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return ok(user_dict(request.user), "Текущий пользователь")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_groups(request):
    """Groups the user actually joined — the frontend polls this to raise real
    notifications when a teammate joins or a team completes."""
    memberships = (
        Membership.objects.filter(user=request.user)
        .select_related("group__product")
        .order_by("-joined_at")
    )
    out = [
        {"group": with_effective_status(group_dict(m.group)), "product": product_dict(m.group.product)}
        for m in memberships
    ]
    return ok(out, "My groups")


# ------------------------------------------------------------------- products


@api_view(["GET"])
def list_products(request):
    qs = Product.objects.filter(is_active=True)
    category = request.GET.get("category")
    marketplace = request.GET.get("marketplace")
    max_price = request.GET.get("max_price")
    if category:
        qs = qs.filter(category__iexact=category)
    if marketplace:
        qs = qs.filter(marketplace__iexact=marketplace)
    if max_price not in (None, ""):
        try:
            qs = qs.filter(price_individual__lte=float(max_price))
        except (TypeError, ValueError):
            return fail("max_price must be a number", 400)
    return ok([product_dict(p) for p in qs], "Products loaded")


@api_view(["GET"])
def get_product(request, product_id):
    product = Product.objects.filter(pk=product_id).first()
    if product is None:
        return fail("Product not found", 404)
    group = None
    for g in product.groups.all():
        effective = with_effective_status(group_dict(g))
        if effective["status"] == "active":
            group = effective
            break
    return ok({"product": product_dict(product), "group": group}, "Product loaded")


# ----------------------------------------------------------------------- feed


@api_view(["GET"])
def get_feed(request):
    user = _resolve_user(request, request.GET.get("user_id"))
    if user is None:
        return fail("User not found", 404)
    limit = _clamp_int(request.GET.get("limit"), 20, 1, 50)
    products = [product_dict(p) for p in Product.objects.filter(is_active=True)]
    return ok(recommend(user_dict(user), products, limit), "Deal feed loaded")


@api_view(["GET"])
def get_recommendations(request):
    user = _resolve_user(request, request.GET.get("user_id"))
    if user is None:
        return fail("User not found", 404)
    limit = _clamp_int(request.GET.get("limit"), 10, 1, 25)
    products = [product_dict(p) for p in Product.objects.filter(is_active=True)]
    return ok(recommend(user_dict(user), products, limit), "Recommendations loaded")


# ------------------------------------------------------------------- ai buyer


def _create_group_for_product(product: Product, initial_members: int = 0) -> Group:
    members = max(0, min(initial_members, product.group_threshold))
    group = Group.objects.create(
        id=make_id("g"),
        product=product,
        current_members=members,
        threshold=product.group_threshold,
        price_current=calculate_group_price(product_dict(product), members),
        price_individual=product.price_individual,
        expires_at=(datetime.now(timezone.utc) + timedelta(hours=48)).isoformat(),
        status="completed" if members >= product.group_threshold else "active",
    )
    return group


@api_view(["POST"])
def ai_buyer(request):
    query = ((request.data or {}).get("query") or "").strip()
    if not query:
        return fail("query is required", 400)

    parsed = parse_query(query)
    products = [product_dict(p) for p in Product.objects.filter(is_active=True)]
    groups = [group_dict(g) for g in Group.objects.all()]

    candidates = build_candidates(parsed, products, groups)
    selection = gemini_select(query, candidates)

    product_d = None
    group_d = None
    reply = None
    used_gemini = False
    from_internet = False
    if selection is not None:
        product_id, reply = selection
        used_gemini = True
        product_d = next((c["product"] for c in candidates if c["product"]["id"] == product_id), None)
        group_d = next((c["group"] for c in candidates if c["product"]["id"] == product_id), None)
    if product_d is None:
        product_d, group_d = pick_product(products, groups, parsed)
        reply = None

    # Nothing in our catalog? Pull a real product from the web (SerpApi) and
    # add it to the catalog so a group can be formed around it.
    if product_d is None:
        external = search_external(query, parsed)
        if external is not None:
            product = Product.objects.create(id=make_id("p"), seller=None, is_active=True, **external)
            product_d = product_dict(product)
            group_d = None
            from_internet = True

    if product_d is None:
        return ok(
            {"reply": build_reply(parsed, None, None, False), "product": None, "group": None,
             "created": False, "parsed": parsed, "ai": "gemini" if used_gemini else "rules",
             "from_internet": False},
            "AI buyer result",
        )

    created = False
    if group_d is None:
        product = Product.objects.get(pk=product_d["id"])
        group_d = group_dict(_create_group_for_product(product))
        created = True

    if reply is None:
        reply = build_reply(parsed, product_d, group_d, created)
    if from_internet:
        reply = "🌐 В каталоге не было — нашёл в интернете. " + reply

    data = {
        "reply": reply,
        "product": product_d,
        "group": group_d,
        "created": created,
        "parsed": parsed,
        "ai": "gemini" if used_gemini else "rules",
        "from_internet": from_internet,
    }
    return ok(data, "AI buyer result")


# --------------------------------------------------------------------- groups


@api_view(["GET"])
def list_groups(request):
    groups = [
        g
        for g in (with_effective_status(group_dict(item)) for item in Group.objects.select_related("product"))
        if g["status"] in {"active", "completed"}
    ]
    return ok(groups, "Groups loaded")


@api_view(["POST"])
def create_group(request):
    product_id = (request.data or {}).get("product_id")
    if not product_id:
        return fail("product_id is required", 400)
    product = Product.objects.filter(pk=product_id).first()
    if product is None:
        return fail("Product not found", 404)
    for g in product.groups.all():
        effective = with_effective_status(group_dict(g))
        if is_group_joinable(effective):
            return ok({"group": effective, "created": False}, "Active group already exists")
    group = _create_group_for_product(product)
    return ok({"group": group_dict(group), "created": True}, "Group created")


@api_view(["GET"])
def get_group(request, group_id):
    group = Group.objects.select_related("product").filter(pk=group_id).first()
    if group is None:
        return fail("Group not found", 404)
    data = {"group": with_effective_status(group_dict(group)), "product": product_dict(group.product)}
    return ok(data, "Group loaded")


@api_view(["POST"])
def join_group(request, group_id):
    user = _resolve_user(request, (request.data or {}).get("user_id"))
    if user is None:
        return fail("User not found", 404)
    group = Group.objects.select_related("product").filter(pk=group_id).first()
    if group is None:
        return fail("Group not found", 404)

    effective = with_effective_status(group_dict(group))
    product = group.product
    if effective["status"] == "expired":
        return fail("Group has expired", 409)
    if not is_group_joinable(effective):
        return fail("Group is already completed", 409)

    # "1 verified SIM = 1 seat": a user only counts once per group.
    already = Membership.objects.filter(group=group, user=user).exists()
    if already:
        next_members = group.current_members
    else:
        Membership.objects.create(group=group, user=user)
        next_members = min(group.current_members + 1, group.threshold)

    new_price = calculate_group_price(product_dict(product), next_members)
    group.current_members = next_members
    group.price_current = new_price
    group.status = "completed" if next_members >= group.threshold else "active"
    group.save(update_fields=["current_members", "price_current", "status"])

    savings_pct = round((1 - new_price / product.price_individual) * 100, 1)
    data = {"group": group_dict(group), "new_price": new_price, "savings_pct": savings_pct}
    return ok(data, "Joined group and recalculated price")


# ----------------------------------------------------------- seller cabinet


def _validate_product_payload(payload: dict) -> tuple[dict | None, str | None]:
    name = (payload.get("name") or "").strip()
    if not name:
        return None, "Укажите название товара"
    try:
        price_individual = float(payload.get("price_individual"))
        price_group_min = float(payload.get("price_group_min"))
    except (TypeError, ValueError):
        return None, "Цены должны быть числами"
    if price_individual <= 0 or price_group_min <= 0:
        return None, "Цены должны быть больше нуля"
    if price_group_min > price_individual:
        return None, "Групповая цена не может быть выше розничной"
    threshold = _clamp_int(payload.get("group_threshold"), 10, 2, 100)
    tags = payload.get("tags") or []
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    fields = {
        "name": name,
        "description": (payload.get("description") or "").strip(),
        "marketplace": payload.get("marketplace") or "AliExpress",
        "category": payload.get("category") or "Electronics",
        "tags": tags if isinstance(tags, list) else [],
        "price_individual": round(price_individual, 2),
        "price_group_min": round(price_group_min, 2),
        "group_threshold": threshold,
        "image_url": (payload.get("image_url") or "").strip(),
        "rating": 4.5,
        "origin_country": payload.get("origin_country") or "China",
    }
    return fields, None


@api_view(["GET", "POST"])
@permission_classes([IsSeller])
def seller_products(request):
    if request.method == "GET":
        products = Product.objects.filter(seller=request.user).order_by("-created_at")
        return ok([product_dict(p) for p in products], "Seller products")

    fields, error = _validate_product_payload(request.data or {})
    if error:
        return fail(error, 400)
    product = Product.objects.create(id=make_id("p"), seller=request.user, is_active=True, **fields)
    # Seed a starter group (~30% filled) so the join/price-drop flow works immediately.
    _create_group_for_product(product, initial_members=max(1, product.group_threshold // 3))
    return ok(product_dict(product), "Товар добавлен")


@api_view(["PATCH", "DELETE"])
@permission_classes([IsSeller])
def seller_product_detail(request, product_id):
    product = Product.objects.filter(pk=product_id, seller=request.user).first()
    if product is None:
        return fail("Товар не найден или не принадлежит вам", 404)

    if request.method == "DELETE":
        product.delete()  # cascades groups + memberships
        return ok({"id": product_id}, "Товар удалён")

    fields, error = _validate_product_payload({**product_dict(product), **(request.data or {})})
    if error:
        return fail(error, 400)
    for key, value in fields.items():
        setattr(product, key, value)
    product.save()
    return ok(product_dict(product), "Товар обновлён")
