import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PRODUCTS_PATH = path.join(ROOT, "backend/data/products.json");
const TARGET_IMPORTED_COUNT = 200;
const USER_AGENT = "GroupBuyKZ-Hackathon/1.0 (real product catalog import)";
const WAIT_MS = 350;

const SOURCES = [
  {
    marketplace: "OpenFoodFacts",
    host: "https://world.openfoodfacts.org",
    category: "Food",
    target: 125,
    queries: ["coffee", "tea", "cereal", "cookies", "pasta", "juice", "cheese", "nuts", "yogurt", "rice", "olive oil", "protein"],
  },
  {
    marketplace: "OpenBeautyFacts",
    host: "https://world.openbeautyfacts.org",
    category: "Beauty",
    target: 50,
    queries: ["cream", "shampoo", "soap", "lotion", "sunscreen", "serum", "perfume", "makeup"],
  },
  {
    marketplace: "OpenProductsFacts",
    host: "https://world.openproductsfacts.org",
    category: "Electronics",
    target: 45,
    queries: ["headphones", "keyboard", "mouse", "charger", "watch", "speaker", "backpack", "bottle", "phone", "shoes", "lamp", "bag"],
  },
];

const FX_TO_USD = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  CHF: 1.11,
  MXN: 0.054,
  BRL: 0.18,
};

function hash(input) {
  let value = 0;
  for (const char of input) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function cleanToken(value) {
  return value
    .replace(/^en:/, "")
    .replace(/^fr:/, "")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase();
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function countryName(tags = []) {
  const tag = tags.find((item) => item.startsWith("en:")) ?? tags[0];
  if (!tag) return "Global";
  return titleCase(cleanToken(tag));
}

function sourceUrl(source, code) {
  return `${source.host}/product/${encodeURIComponent(code)}`;
}

function inferProductCategory(source, product) {
  if (source.marketplace !== "OpenProductsFacts") return source.category;
  const tags = (product.categories_tags ?? []).map(cleanToken).join(" ");
  if (/shoe|shirt|clothing|bag|backpack|fashion/.test(tags)) return "Fashion";
  if (/sport|fitness|ball|bike|yoga/.test(tags)) return "Sports";
  if (/home|kitchen|bottle|furniture|decor/.test(tags)) return "Home";
  return "Electronics";
}

function fallbackPriceUsd(category, code) {
  const ranges = {
    Food: [2.5, 18],
    Beauty: [5, 45],
    Electronics: [18, 140],
    Fashion: [12, 80],
    Sports: [10, 95],
    Home: [8, 70],
  };
  const [min, max] = ranges[category] ?? [8, 70];
  const ratio = (hash(code) % 10_000) / 10_000;
  return roundMoney(min + (max - min) * ratio);
}

async function getJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      });
      if (response.ok) return response.json();
      lastError = new Error(`${response.status} ${response.statusText}: ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }
  throw lastError;
}

async function searchSource(source, query, page) {
  const params = new URLSearchParams({
    search_terms: query,
    page: String(page),
    page_size: "45",
    fields: [
      "code",
      "product_name",
      "brands",
      "image_url",
      "categories_tags",
      "countries_tags",
      "nutriscore_grade",
    ].join(","),
  });
  const data = await getJson(`${source.host}/api/v2/search?${params.toString()}`);
  return Array.isArray(data.products) ? data.products : [];
}

async function findPrice(productCode) {
  try {
    const params = new URLSearchParams({ product_code: productCode, size: "1" });
    const data = await getJson(`https://prices.openfoodfacts.org/api/v1/prices?${params.toString()}`);
    const item = Array.isArray(data.items) ? data.items[0] : null;
    if (!item?.price || !item?.currency) return null;
    const rate = FX_TO_USD[item.currency] ?? null;
    return {
      priceUsd: rate ? roundMoney(Number(item.price) * rate) : null,
      sourcePrice: Number(item.price),
      sourceCurrency: item.currency,
      sourceLocation: item.location?.osm_name ?? item.location?.osm_brand ?? null,
    };
  } catch {
    return null;
  }
}

function normalizeProduct(source, product, importedIndex, priceInfo) {
  const category = inferProductCategory(source, product);
  const code = String(product.code);
  const name = [product.brands, product.product_name].filter(Boolean).join(" ").trim();
  const tags = [
    category.toLowerCase(),
    source.marketplace.toLowerCase(),
    ...((product.categories_tags ?? []).slice(0, 5).map(cleanToken)),
  ]
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .slice(0, 8);
  const individual = priceInfo?.priceUsd ?? fallbackPriceUsd(category, code);
  const discountSeed = 0.18 + ((hash(`${code}-discount`) % 18) / 100);
  const threshold = 5 + (hash(`${code}-threshold`) % 11);

  return {
    id: `real${String(importedIndex).padStart(3, "0")}`,
    name: name.slice(0, 96),
    description: `Real catalog item from ${source.marketplace}. Barcode/source code: ${code}.`,
    marketplace: source.marketplace,
    category,
    tags,
    price_individual: individual,
    price_group_min: roundMoney(individual * (1 - discountSeed)),
    group_threshold: threshold,
    image_url: product.image_url,
    rating: roundMoney(4.1 + ((hash(`${code}-rating`) % 80) / 100)),
    origin_country: countryName(product.countries_tags),
    source_id: code,
    source_url: sourceUrl(source, code),
    source_price: priceInfo?.sourcePrice ?? null,
    source_currency: priceInfo?.sourceCurrency ?? null,
    source_location: priceInfo?.sourceLocation ?? null,
  };
}

async function collectProducts() {
  const seenCodes = new Set();
  const rawItems = [];

  for (const source of SOURCES) {
    const sourceItems = [];
    for (const query of source.queries) {
      if (sourceItems.length >= source.target) break;
      for (let page = 1; page <= 3; page++) {
        if (sourceItems.length >= source.target) break;
        let results = [];
        try {
          results = await searchSource(source, query, page);
        } catch (error) {
          console.warn(`Skipping ${source.marketplace}/${query}/page-${page}: ${error.message}`);
          continue;
        }
        await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
        for (const product of results) {
          const code = String(product.code ?? "");
          if (!code || seenCodes.has(code) || !product.product_name || !product.image_url) continue;
          seenCodes.add(code);
          sourceItems.push({ source, product });
          if (sourceItems.length >= source.target) break;
        }
      }
    }
    rawItems.push(...sourceItems);
  }

  const selected = rawItems.slice(0, TARGET_IMPORTED_COUNT);
  const priceInfos = await Promise.all(
    selected.map(({ source, product }) =>
      source.marketplace === "OpenFoodFacts" ? findPrice(String(product.code)) : Promise.resolve(null)
    )
  );

  return selected.map(({ source, product }, index) => normalizeProduct(source, product, index + 1, priceInfos[index]));
}

const existing = JSON.parse(await fs.readFile(PRODUCTS_PATH, "utf8"));
const preserved = existing.filter((product) => !String(product.id).startsWith("real"));
const imported = await collectProducts();

if (imported.length < 180) {
  throw new Error(`Expected about 200 real products, got ${imported.length}`);
}

await fs.writeFile(PRODUCTS_PATH, `${JSON.stringify([...preserved, ...imported], null, 2)}\n`);

const pricedCount = imported.filter((product) => product.source_price).length;
console.log(
  JSON.stringify(
    {
      preserved: preserved.length,
      imported: imported.length,
      total: preserved.length + imported.length,
      imported_with_real_prices: pricedCount,
      marketplaces: [...new Set(imported.map((product) => product.marketplace))],
    },
    null,
    2
  )
);
