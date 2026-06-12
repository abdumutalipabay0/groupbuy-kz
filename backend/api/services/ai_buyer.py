"""AI-buyer: free-text query -> product recommendation + group find-or-create.

Pipeline (per the architecture doc):
  1. deterministic rule-based NLU (budget + RU/KZ/EN keywords) builds a shortlist
     of candidate products *from the database*;
  2. Google Gemini chooses the best candidate and writes a friendly reply,
     given each candidate's live group state;
  3. if GEMINI_API_KEY is unset or the call fails, fall back to the rule-based
     pick + a template reply — so the demo always works offline.

Group find-or-create happens in the view (it needs DB writes); this module only
selects the product and produces the reply text.
"""
import json
import re

from django.conf import settings

from api.services.group_status import is_group_joinable, with_effective_status

KZT_PER_USD = settings.KZT_PER_USD

# Stem -> catalog signals. Stems are matched as substrings of the lowercased
# query, so Russian/Kazakh inflections resolve naturally ("наушники" ~ "наушник").
KEYWORDS: list[tuple[str, dict]] = [
    ("наушник", {"category": "Electronics", "hints": ["soundcore", "buds", "headphone", "airpod"]}),
    ("гарнитур", {"category": "Electronics", "hints": ["soundcore", "buds", "headphone"]}),
    ("құлаққап", {"category": "Electronics", "hints": ["soundcore", "buds", "headphone"]}),
    ("час", {"category": "Electronics", "hints": ["watch", "forerunner", "garmin"]}),
    ("сағат", {"category": "Electronics", "hints": ["watch", "forerunner"]}),
    ("мыш", {"category": "Electronics", "hints": ["mouse", "logitech"], "tags": ["gaming"]}),
    ("тышқан", {"category": "Electronics", "hints": ["mouse", "logitech"]}),
    ("клавиатур", {"category": "Electronics", "hints": ["keyboard"]}),
    ("зарядк", {"category": "Electronics", "hints": ["charger", "gan", "baseus"]}),
    ("зарядн", {"category": "Electronics", "hints": ["charger", "gan", "baseus"]}),
    ("фен", {"category": "Beauty", "hints": ["dyson", "dryer", "supersonic"]}),
    ("телефон", {"category": "Electronics", "hints": ["phone"], "tags": ["gadgets"]}),
    ("смартфон", {"category": "Electronics", "hints": ["phone"], "tags": ["gadgets"]}),
    ("колонк", {"category": "Electronics", "hints": ["speaker", "soundcore"]}),
    ("пылесос", {"category": "Home", "hints": ["vacuum", "cleaner"]}),
    ("шаңсорғыш", {"category": "Home", "hints": ["vacuum", "cleaner"]}),
    ("крем", {"category": "Beauty", "hints": ["cream", "snail", "mucin"]}),
    ("косметик", {"category": "Beauty", "hints": []}),
    ("уход", {"category": "Beauty", "hints": []}),
    ("маск", {"category": "Beauty", "hints": ["mask"]}),
    ("шампун", {"category": "Beauty", "hints": ["shampoo"]}),
    ("мыло", {"category": "Beauty", "hints": ["soap"]}),
    ("носк", {"category": "Fashion", "hints": ["socks", "nike"]}),
    ("одежд", {"category": "Fashion", "hints": []}),
    ("киім", {"category": "Fashion", "hints": []}),
    ("кроссовк", {"category": "Fashion", "hints": ["nike", "shoes"], "tags": ["sports"]}),
    ("спорт", {"category": "Sports", "hints": [], "tags": ["sports"]}),
    ("дом", {"category": "Home", "hints": [], "tags": ["home"]}),
    ("үй", {"category": "Home", "hints": []}),
    ("полк", {"category": "Home", "hints": ["raskog", "cart", "shelf", "ikea"]}),
    ("тележк", {"category": "Home", "hints": ["raskog", "cart", "ikea"]}),
    ("шоколад", {"category": "Food", "hints": ["chocolate", "nutella", "cocoa"]}),
    ("вода", {"category": "Food", "hints": ["water", "evian", "vittel"]}),
    ("молок", {"category": "Food", "hints": ["milk", "lait"]}),
    ("сыр", {"category": "Food", "hints": ["cheese", "fromage"]}),
    ("кофе", {"category": "Food", "hints": ["coffee"]}),
    ("чай", {"category": "Food", "hints": ["tea"]}),
    ("сок", {"category": "Food", "hints": ["juice"]}),
    ("еда", {"category": "Food", "hints": []}),
    ("продукт", {"category": "Food", "hints": []}),
    ("тамақ", {"category": "Food", "hints": []}),
    ("игр", {"category": "Electronics", "hints": ["logitech", "g305"], "tags": ["gaming"]}),
    ("гейм", {"category": "Electronics", "hints": ["logitech"], "tags": ["gaming"]}),
    ("ойын", {"category": "Electronics", "hints": ["logitech"], "tags": ["gaming"]}),
    ("электрон", {"category": "Electronics", "hints": [], "tags": ["electronics"]}),
    ("гаджет", {"category": "Electronics", "hints": [], "tags": ["gadgets"]}),
    ("техник", {"category": "Electronics", "hints": []}),
]


def parse_budget_usd(query: str) -> float | None:
    q = query.lower()
    match = re.search(
        r"(\d[\d\s]{0,9})\s*(к|k|тыс\.?|мың)?\s*(тенге|тг|₸|kzt|долл\w*|\$|usd)?",
        q,
    )
    if not match or not match.group(1).strip():
        return None
    raw = float(match.group(1).replace(" ", ""))
    if match.group(2):
        raw *= 1000
    currency = match.group(3) or ""
    if raw <= 0:
        return None
    if currency in ("$", "usd") or currency.startswith("долл"):
        return raw
    if currency or raw >= 2000:
        return round(raw / KZT_PER_USD, 2)
    return raw


def parse_query(query: str) -> dict:
    q = query.lower()
    categories: set[str] = set()
    tags: set[str] = set()
    hints: set[str] = set()
    for stem, signal in KEYWORDS:
        if stem in q:
            if signal.get("category"):
                categories.add(signal["category"])
            tags.update(signal.get("tags", []))
            hints.update(signal.get("hints", []))
    latin_tokens = {t for t in re.findall(r"[a-z]{3,}", q) if t not in ("usd", "kzt")}
    return {
        "budget_usd": parse_budget_usd(query),
        "categories": sorted(categories),
        "tags": sorted(tags),
        "hints": sorted(hints | latin_tokens),
    }


def score_product(product: dict, parsed: dict, has_active_group: bool) -> float:
    """Signal score comes from query matches only; bonuses can't qualify alone."""
    name = product["name"].lower()
    signal = 0.0
    for hint in parsed["hints"]:
        if hint in name:
            signal += 3.0
    if product["category"] in parsed["categories"]:
        signal += 1.5
    tag_set = set(product["tags"])
    signal += 0.5 * len(tag_set & set(parsed["tags"]))
    if signal == 0.0:
        return 0.0

    score = signal
    budget = parsed["budget_usd"]
    if budget:
        if product["price_individual"] <= budget:
            score += 1.0
        elif product["price_individual"] > budget * 1.4:
            score -= 2.0
    if has_active_group:
        score += 1.0
    score += product["rating"] * 0.05
    return score


def _joinable_by_product(groups: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for group in groups:
        effective = with_effective_status(group)
        if is_group_joinable(effective):
            out[group["product_id"]] = effective
    return out


def build_candidates(parsed: dict, products: list[dict], groups: list[dict], limit: int = 12) -> list[dict]:
    """Top scored products (with their joinable group, if any) for Gemini to choose from."""
    joinable = _joinable_by_product(groups)
    scored = []
    for product in products:
        score = score_product(product, parsed, product["id"] in joinable)
        if score > 0:
            scored.append((score, product))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [{"product": p, "group": joinable.get(p["id"])} for _, p in scored[:limit]]


def pick_product(products: list[dict], groups: list[dict], parsed: dict) -> tuple[dict | None, dict | None]:
    """Rule-based fallback: return (product, joinable_group_or_None)."""
    joinable = _joinable_by_product(groups)
    best, best_score = None, 0.0
    for product in products:
        score = score_product(product, parsed, product["id"] in joinable)
        if score > best_score:
            best, best_score = product, score
    if best is None or best_score <= 0.0:
        return None, None
    return best, joinable.get(best["id"])


def build_reply(parsed: dict, product: dict | None, group: dict | None, created: bool) -> str:
    if product is None:
        return (
            "Пока не нашёл подходящего товара 🤔 Попробуй уточнить: например, "
            "«наушники до 30 000 ₸», «крем для лица» или «что-нибудь для дома»."
        )
    budget_note = ""
    if parsed["budget_usd"]:
        kzt = round(parsed["budget_usd"] * KZT_PER_USD / 100) * 100
        budget_note = f" Уложился в твой бюджет {kzt:,} ₸.".replace(",", " ")
    if created or group is None:
        threshold = group["threshold"] if group else product["group_threshold"]
        return (
            f"Нашёл: {product['name']} ⭐ {product['rating']}. Активной группы не было — "
            f"я создал новую на {threshold} мест, ты первый участник."
            f"{budget_note} Зови друзей — чем больше группа, тем ниже цена!"
        )
    spots = max(group["threshold"] - group["current_members"], 0)
    return (
        f"Нашёл: {product['name']} ⭐ {product['rating']}. Уже есть группа "
        f"{group['current_members']}/{group['threshold']} — осталось {spots} мест, "
        f"цена уже снижена.{budget_note} Вступай, пока группа не закрылась!"
    )


# ----------------------------------------------------------------- Gemini layer

_GEMINI_SYSTEM = (
    "Ты — AI-байер приложения Birge (совместные групповые покупки в Казахстане). "
    "Тебе дают запрос пользователя и список товаров-кандидатов с состоянием их групп. "
    "Выбери ОДИН наиболее подходящий товар и напиши дружелюбный ответ на русском "
    "(2-3 предложения, можно 1-2 эмодзи). Если у товара уже есть группа — упомяни, "
    "сколько мест осталось; если группы нет — скажи, что создашь новую и пользователь "
    "будет первым участником. Учитывай бюджет, если он указан. "
    "Верни строго JSON: {\"product_id\": \"<id из списка>\", \"reply\": \"<текст>\"}."
)


def gemini_select(query: str, candidates: list[dict]) -> tuple[str, str] | None:
    """Ask Gemini to choose a product_id + write a reply. None on any failure."""
    if not settings.GEMINI_API_KEY or not candidates:
        return None
    try:
        import requests  # local import so the app runs even if requests is absent

        compact = [
            {
                "product_id": c["product"]["id"],
                "name": c["product"]["name"],
                "category": c["product"]["category"],
                "price_individual_usd": c["product"]["price_individual"],
                "rating": c["product"]["rating"],
                "group": (
                    {
                        "members": c["group"]["current_members"],
                        "threshold": c["group"]["threshold"],
                        "price_current_usd": c["group"]["price_current"],
                    }
                    if c.get("group")
                    else None
                ),
            }
            for c in candidates
        ]
        prompt = (
            f"{_GEMINI_SYSTEM}\n\nЗапрос пользователя: {query}\n\n"
            f"Кандидаты (JSON): {json.dumps(compact, ensure_ascii=False)}"
        )
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        )
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "string"},
                        "reply": {"type": "string"},
                    },
                    "required": ["product_id", "reply"],
                },
            },
        }
        resp = requests.post(url, json=body, timeout=12)
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        product_id = parsed.get("product_id")
        reply = (parsed.get("reply") or "").strip()
        valid_ids = {c["product"]["id"] for c in candidates}
        if product_id in valid_ids and reply:
            return product_id, reply
        return None
    except Exception:
        return None
