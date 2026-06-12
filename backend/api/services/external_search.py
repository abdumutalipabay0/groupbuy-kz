"""Real product lookup on the open web when the local catalog has no match.

Uses SerpApi's Google Shopping engine (set SERPAPI_KEY). Returns a product-shaped
dict ready to persist, or None if disabled / nothing found. Prices come back in
the locale currency (KZT for gl=kz) and are converted to the USD the catalog uses.
"""
from django.conf import settings


def search_external(query: str, parsed: dict) -> dict | None:
    if not settings.EXTERNAL_SEARCH_ENABLED or not settings.SERPAPI_KEY:
        return None
    try:
        import requests

        resp = requests.get(
            "https://serpapi.com/search.json",
            params={
                "engine": "google_shopping",
                "q": query,
                "gl": settings.SERPAPI_GL,
                "hl": settings.SERPAPI_HL,
                "num": "10",
                "api_key": settings.SERPAPI_KEY,
            },
            timeout=12,
        )
        resp.raise_for_status()
        results = resp.json().get("shopping_results") or []
        for item in results:
            title = (item.get("title") or "").strip()
            price_val = item.get("extracted_price")
            if not title or not price_val:
                continue
            usd = round(float(price_val) / settings.KZT_PER_USD, 2)
            if usd <= 0:
                continue
            category = (parsed.get("categories") or ["Other"])[0]
            source = item.get("source") or "Online"
            return {
                "name": title[:200],
                "description": f"Найдено в интернете через {source} по запросу «{query}».",
                "marketplace": source[:40],
                "category": category,
                "tags": parsed.get("tags") or [],
                "price_individual": usd,
                "price_group_min": round(usd * 0.78, 2),
                "group_threshold": 10,
                "image_url": item.get("thumbnail", ""),
                "rating": float(item.get("rating") or 4.5),
                "origin_country": "—",
                "source_id": str(item.get("product_id") or ""),
                "source_url": item.get("product_link") or item.get("link") or "",
                "source_price": float(price_val),
                "source_currency": settings.SERPAPI_GL.upper() == "KZ" and "KZT" or "USD",
                "source_location": source,
            }
        return None
    except Exception:
        return None
