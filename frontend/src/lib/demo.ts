/**
 * Standalone demo API — mirrors the Django backend contract entirely in the
 * browser using the bundled seed JSON. Activated by `api.ts` when the real
 * backend is unreachable (e.g. on the Vercel deployment), so the hosted demo
 * works with zero infrastructure. Join state persists in localStorage.
 */
import productsSeed from "@/data/products.json";
import groupsSeed from "@/data/groups.json";
import usersSeed from "@/data/users.json";
import { calculateGroupPrice, isGroupExpired } from "@/lib/utils";
import type {
  AiBuyerParsed,
  AiBuyerResponse,
  AuthResponse,
  Group,
  GroupDetail,
  JoinGroupResponse,
  Product,
  ProductDetail,
  RegisterRequest,
  Role,
  SellerProductInput,
  SimRequestResponse,
  User
} from "@/types";

const SEED_PRODUCTS = productsSeed as unknown as Product[];
const DB_KEY = "groupbuy-demo-db";

interface DemoAuthUser extends User {
  password?: string;
  token: string;
}

interface DemoDb {
  groups: Group[];
  users: User[];
  sellerProducts: Product[];
  authUsers: DemoAuthUser[];
}

function loadDb(): DemoDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoDb>;
      if (Array.isArray(parsed.groups) && Array.isArray(parsed.users)) {
        return {
          groups: parsed.groups,
          users: parsed.users,
          sellerProducts: parsed.sellerProducts ?? [],
          authUsers: parsed.authUsers ?? []
        };
      }
    }
  } catch {
    /* corrupted storage — reseed */
  }
  return {
    groups: structuredClone(groupsSeed) as unknown as Group[],
    users: structuredClone(usersSeed) as unknown as User[],
    sellerProducts: [],
    authUsers: []
  };
}

/** Seed (bundled) catalog + any products demo sellers added in the browser. */
function allProducts(): Product[] {
  return [...db.sellerProducts, ...SEED_PRODUCTS];
}

/** The signed-in user, read from the persisted zustand session. */
function currentUser(): User | null {
  try {
    const raw = localStorage.getItem("groupbuy-session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { userProfile?: User } };
    return parsed?.state?.userProfile ?? null;
  } catch {
    return null;
  }
}

function saveDb(db: DemoDb): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* private mode etc. — keep going in-memory */
  }
}

const db = loadDb();

function withEffectiveStatus(group: Group): Group {
  return isGroupExpired(group) ? { ...group, status: "expired" } : group;
}

/* ----------------------------------------------------------- recommender */

const CITY_POPULAR: Record<string, string[]> = {
  Almaty: ["electronics", "fashion", "beauty", "sports"],
  Astana: ["electronics", "home", "fashion"],
  Shymkent: ["fashion", "home", "food"]
};

function recommend(user: User, products: Product[], limit: number): Product[] {
  const userTags = new Set(user.interests);
  const cityTags = new Set(CITY_POPULAR[user.city] ?? []);

  if (userTags.size === 0) {
    return [...products].sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  const score = (product: Product): number => {
    const tagSet = new Set(product.tags);
    let overlapCount = 0;
    for (const tag of userTags) if (tagSet.has(tag)) overlapCount++;
    const overlap = overlapCount / userTags.size;
    const budgetBonus = product.price_individual <= user.budget_usd ? 1.5 : 0.8;
    let cityHit = false;
    for (const tag of cityTags) if (tagSet.has(tag)) cityHit = true;
    const cityBonus = cityHit ? 1.2 : 1.0;
    return overlap * budgetBonus * cityBonus + product.rating * 0.05;
  };

  return [...products].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

/* ------------------------------------------------------------- endpoints */

function makeId(prefix: string): string {
  return `${prefix}${Math.random().toString(16).slice(2, 10)}`;
}

/* ----------------------------------------------------------------- auth */

const DEMO_PASSWORD = "birge123";

function ensureSeededAccounts(): void {
  // Mirror the backend's seed_demo test accounts so login works offline.
  const seeds: DemoAuthUser[] = [
    {
      id: "demo-buyer", name: "Аружан (тест)", city: "Almaty", age: 24,
      interests: ["gaming", "electronics", "gadgets"], budget_usd: 120, sim_verified: true,
      currency_preference: "KZT", language: "ru", role: "buyer", phone: "+77000000001",
      password: DEMO_PASSWORD, token: "demo-token-buyer"
    },
    {
      id: "demo-seller", name: "Тимур (тест)", city: "Astana", age: 30, interests: [],
      budget_usd: 200, sim_verified: true, currency_preference: "KZT", language: "ru",
      role: "seller", phone: "+77000000002", shop_name: "TechStore KZ",
      password: DEMO_PASSWORD, token: "demo-token-seller"
    }
  ];
  let changed = false;
  for (const seed of seeds) {
    if (!db.authUsers.some((u) => u.phone === seed.phone)) {
      db.authUsers.push(seed);
      changed = true;
    }
  }
  if (changed) saveDb(db);
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const fixed = digits.length === 11 && digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  return "+" + fixed;
}

function simRequest(): SimRequestResponse {
  return { phone: "", sent: true, dev_code: "0000" }; // demo: any code works
}

function register(payload: RegisterRequest): AuthResponse {
  const phone = normalizePhone(payload.phone);
  const user: DemoAuthUser = {
    id: makeId("u"),
    name: payload.name || "Гость",
    city: payload.city ?? "Almaty",
    age: payload.age ?? 24,
    interests: payload.interests ?? [],
    budget_usd: payload.budget_usd ?? 120,
    sim_verified: true,
    currency_preference: payload.currency_preference ?? "KZT",
    language: payload.language ?? "ru",
    role: payload.role,
    phone,
    shop_name: payload.shop_name ?? "",
    password: payload.password,
    token: makeId("tok")
  };
  db.authUsers.push(user);
  saveDb(db);
  const { password, token, ...publicUser } = user;
  void password;
  return { token, user: publicUser, sim_verified: true };
}

function login(body: { phone: string; password?: string; code?: string }): AuthResponse {
  ensureSeededAccounts();
  const phone = normalizePhone(body.phone || "");
  const found = db.authUsers.find((u) => u.phone === phone);
  if (!found) throw new Error("Неверные данные для входа");
  if (body.password && found.password && body.password !== found.password) {
    throw new Error("Неверные данные для входа");
  }
  const { password, token, ...publicUser } = found;
  void password;
  return { token, user: publicUser };
}

function me(): User {
  const user = currentUser();
  if (!user) throw new Error("Не авторизован");
  return user;
}

/* -------------------------------------------------------------- seller */

function sellerList(): Product[] {
  const user = currentUser();
  if (!user || user.role !== "seller") throw new Error("Доступно только продавцам");
  return db.sellerProducts.filter((p) => p.source_id === `seller:${user.id}`);
}

function sellerCreate(input: SellerProductInput): Product {
  const user = currentUser();
  if (!user || user.role !== "seller") throw new Error("Доступно только продавцам");
  const threshold = Math.max(2, Math.min(100, Math.round(input.group_threshold) || 10));
  const product: Product = {
    id: makeId("p"),
    name: input.name,
    description: input.description ?? "",
    marketplace: (input.marketplace as Product["marketplace"]) ?? "AliExpress",
    category: input.category,
    tags: input.tags ?? [],
    price_individual: Number(input.price_individual),
    price_group_min: Number(input.price_group_min),
    group_threshold: threshold,
    image_url: input.image_url ?? "",
    rating: 4.5,
    origin_country: input.origin_country ?? "China",
    source_id: `seller:${user.id}` // tag ownership for the demo
  };
  db.sellerProducts.unshift(product);
  // starter group (~30% filled) so the join/price-drop flow works immediately
  const members = Math.max(1, Math.floor(threshold / 3));
  db.groups.push({
    id: makeId("g"),
    product_id: product.id,
    current_members: members,
    threshold,
    price_current: calculateGroupPrice(product, members),
    price_individual: product.price_individual,
    expires_at: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    status: "active"
  });
  saveDb(db);
  return product;
}

function sellerDelete(productId: string): { id: string } {
  db.sellerProducts = db.sellerProducts.filter((p) => p.id !== productId);
  db.groups = db.groups.filter((g) => g.product_id !== productId);
  saveDb(db);
  return { id: productId };
}

/* -------------------------------------------------------------- catalog */

function listProducts(params: URLSearchParams): Product[] {
  let products = allProducts();
  const category = params.get("category");
  const marketplace = params.get("marketplace");
  const maxPrice = params.get("max_price");
  if (category) products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  if (marketplace) products = products.filter((p) => p.marketplace.toLowerCase() === marketplace.toLowerCase());
  if (maxPrice) products = products.filter((p) => p.price_individual <= Number(maxPrice));
  return products;
}

function getProduct(productId: string): ProductDetail {
  const product = allProducts().find((p) => p.id === productId);
  if (!product) throw new Error("Product not found");
  const group =
    db.groups
      .map(withEffectiveStatus)
      .find((g) => g.product_id === productId && g.status === "active") ?? null;
  return { product, group };
}

function getFeed(params: URLSearchParams): Product[] {
  const userId = params.get("user_id") ?? "";
  const limit = Math.max(1, Math.min(50, Number(params.get("limit")) || 20));
  const user =
    currentUser() ?? db.users.find((u) => u.id === userId) ?? db.users[0];
  if (!user) throw new Error("User not found");
  return recommend(user, allProducts(), limit);
}

function listGroups(): Group[] {
  return db.groups
    .map(withEffectiveStatus)
    .filter((g) => g.status === "active" || g.status === "completed");
}

function getGroup(groupId: string): GroupDetail {
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) throw new Error("Group not found");
  const product = allProducts().find((p) => p.id === group.product_id);
  if (!product) throw new Error("Product not found for group");
  return { group: withEffectiveStatus(group), product };
}

function joinGroup(groupId: string): JoinGroupResponse {
  const index = db.groups.findIndex((g) => g.id === groupId);
  if (index === -1) throw new Error("Group not found");
  const group = db.groups[index];
  const effective = withEffectiveStatus(group);
  const product = allProducts().find((p) => p.id === group.product_id);
  if (!product) throw new Error("Product not found for group");
  if (effective.status === "expired") throw new Error("Group has expired");
  if (effective.status !== "active" || effective.current_members >= effective.threshold) {
    throw new Error("Group is already completed");
  }

  const nextMembers = Math.min(effective.current_members + 1, effective.threshold);
  const newPrice = calculateGroupPrice(product, nextMembers);
  const updated: Group = {
    ...group,
    current_members: nextMembers,
    price_current: newPrice,
    status: nextMembers >= effective.threshold ? "completed" : "active"
  };
  db.groups[index] = updated;
  saveDb(db);
  const savingsPct = Math.round((1 - newPrice / product.price_individual) * 1000) / 10;
  return { group: updated, new_price: newPrice, savings_pct: savingsPct };
}

/* --------------------------------------------------------------- ai buyer */
// Mirrors backend/api/services/ai_buyer.py so the Vercel demo works offline.

const KZT_PER_USD = 450;

const AI_KEYWORDS: Array<[string, { category?: string; tags?: string[]; hints?: string[] }]> = [
  ["наушник", { category: "Electronics", hints: ["soundcore", "buds", "headphone", "airpod"] }],
  ["гарнитур", { category: "Electronics", hints: ["soundcore", "buds", "headphone"] }],
  ["құлаққап", { category: "Electronics", hints: ["soundcore", "buds", "headphone"] }],
  ["час", { category: "Electronics", hints: ["watch", "forerunner", "garmin"] }],
  ["сағат", { category: "Electronics", hints: ["watch", "forerunner"] }],
  ["мыш", { category: "Electronics", hints: ["mouse", "logitech"], tags: ["gaming"] }],
  ["тышқан", { category: "Electronics", hints: ["mouse", "logitech"] }],
  ["клавиатур", { category: "Electronics", hints: ["keyboard"] }],
  ["зарядк", { category: "Electronics", hints: ["charger", "gan", "baseus"] }],
  ["зарядн", { category: "Electronics", hints: ["charger", "gan", "baseus"] }],
  ["фен", { category: "Beauty", hints: ["dyson", "dryer", "supersonic"] }],
  ["телефон", { category: "Electronics", hints: ["phone"], tags: ["gadgets"] }],
  ["смартфон", { category: "Electronics", hints: ["phone"], tags: ["gadgets"] }],
  ["колонк", { category: "Electronics", hints: ["speaker", "soundcore"] }],
  ["пылесос", { category: "Home", hints: ["vacuum", "cleaner"] }],
  ["шаңсорғыш", { category: "Home", hints: ["vacuum", "cleaner"] }],
  ["крем", { category: "Beauty", hints: ["cream", "snail", "mucin"] }],
  ["косметик", { category: "Beauty", hints: [] }],
  ["уход", { category: "Beauty", hints: [] }],
  ["маск", { category: "Beauty", hints: ["mask"] }],
  ["шампун", { category: "Beauty", hints: ["shampoo"] }],
  ["мыло", { category: "Beauty", hints: ["soap"] }],
  ["носк", { category: "Fashion", hints: ["socks", "nike"] }],
  ["одежд", { category: "Fashion", hints: [] }],
  ["киім", { category: "Fashion", hints: [] }],
  ["кроссовк", { category: "Fashion", hints: ["nike", "shoes"], tags: ["sports"] }],
  ["спорт", { category: "Sports", hints: [], tags: ["sports"] }],
  ["дом", { category: "Home", hints: [], tags: ["home"] }],
  ["үй", { category: "Home", hints: [] }],
  ["полк", { category: "Home", hints: ["raskog", "cart", "shelf", "ikea"] }],
  ["тележк", { category: "Home", hints: ["raskog", "cart", "ikea"] }],
  ["шоколад", { category: "Food", hints: ["chocolate", "nutella", "cocoa"] }],
  ["вода", { category: "Food", hints: ["water", "evian", "vittel"] }],
  ["молок", { category: "Food", hints: ["milk", "lait"] }],
  ["сыр", { category: "Food", hints: ["cheese", "fromage"] }],
  ["кофе", { category: "Food", hints: ["coffee"] }],
  ["чай", { category: "Food", hints: ["tea"] }],
  ["сок", { category: "Food", hints: ["juice"] }],
  ["еда", { category: "Food", hints: [] }],
  ["продукт", { category: "Food", hints: [] }],
  ["тамақ", { category: "Food", hints: [] }],
  ["игр", { category: "Electronics", hints: ["logitech", "g305"], tags: ["gaming"] }],
  ["гейм", { category: "Electronics", hints: ["logitech"], tags: ["gaming"] }],
  ["ойын", { category: "Electronics", hints: ["logitech"], tags: ["gaming"] }],
  ["электрон", { category: "Electronics", hints: [], tags: ["electronics"] }],
  ["гаджет", { category: "Electronics", hints: [], tags: ["gadgets"] }],
  ["техник", { category: "Electronics", hints: [] }],
];

function parseBudgetUsd(query: string): number | null {
  const q = query.toLowerCase();
  const match = q.match(/(\d[\d\s]{0,9})\s*(к|k|тыс\.?|мың)?\s*(тенге|тг|₸|kzt|долл\w*|\$|usd)?/u);
  if (!match || !match[1].trim()) return null;
  let raw = parseFloat(match[1].replace(/\s/g, ""));
  if (match[2]) raw *= 1000;
  const currency = match[3] ?? "";
  if (!raw || raw <= 0) return null;
  if (currency === "$" || currency === "usd" || currency.startsWith("долл")) return raw;
  if (currency || raw >= 2000) return Math.round((raw / KZT_PER_USD) * 100) / 100;
  return raw;
}

function parseAiQuery(query: string): AiBuyerParsed {
  const q = query.toLowerCase();
  const categories = new Set<string>();
  const tags = new Set<string>();
  const hints = new Set<string>();
  for (const [stem, signal] of AI_KEYWORDS) {
    if (q.includes(stem)) {
      if (signal.category) categories.add(signal.category);
      for (const t of signal.tags ?? []) tags.add(t);
      for (const h of signal.hints ?? []) hints.add(h);
    }
  }
  for (const token of q.match(/[a-z]{3,}/g) ?? []) {
    if (token !== "usd" && token !== "kzt") hints.add(token);
  }
  return {
    budget_usd: parseBudgetUsd(query),
    categories: [...categories].sort(),
    tags: [...tags].sort(),
    hints: [...hints].sort()
  };
}

function scoreAiProduct(product: Product, parsed: AiBuyerParsed, hasActiveGroup: boolean): number {
  const name = product.name.toLowerCase();
  let signal = 0;
  for (const hint of parsed.hints) if (name.includes(hint)) signal += 3;
  if (parsed.categories.includes(product.category)) signal += 1.5;
  const tagSet = new Set(product.tags);
  for (const tag of parsed.tags) if (tagSet.has(tag)) signal += 0.5;
  if (signal === 0) return 0;

  let score = signal;
  if (parsed.budget_usd) {
    if (product.price_individual <= parsed.budget_usd) score += 1;
    else if (product.price_individual > parsed.budget_usd * 1.4) score -= 2;
  }
  if (hasActiveGroup) score += 1;
  score += product.rating * 0.05;
  return score;
}

function createDemoGroup(product: Product): Group {
  const group: Group = {
    id: makeId("g"),
    product_id: product.id,
    current_members: 1,
    threshold: product.group_threshold,
    price_current: calculateGroupPrice(product, 1),
    price_individual: product.price_individual,
    expires_at: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    status: "active"
  };
  db.groups.push(group);
  saveDb(db);
  return group;
}

function aiBuyer(query: string): AiBuyerResponse {
  const parsed = parseAiQuery(query);
  const joinable = new Map<string, Group>();
  for (const g of db.groups) {
    const eff = withEffectiveStatus(g);
    if (eff.status === "active" && eff.current_members < eff.threshold) {
      joinable.set(g.product_id, eff);
    }
  }

  let best: Product | null = null;
  let bestScore = 0;
  for (const product of allProducts()) {
    const score = scoreAiProduct(product, parsed, joinable.has(product.id));
    if (score > bestScore) {
      best = product;
      bestScore = score;
    }
  }

  if (!best) {
    return {
      reply:
        "Пока не нашёл подходящего товара 🤔 Попробуй уточнить: например, «наушники до 30 000 ₸», «крем для лица» или «что-нибудь для дома».",
      product: null,
      group: null,
      created: false,
      parsed
    };
  }

  let group = joinable.get(best.id) ?? null;
  let created = false;
  if (!group) {
    group = createDemoGroup(best);
    created = true;
  }

  const budgetNote = parsed.budget_usd
    ? ` Уложился в твой бюджет ${(Math.round((parsed.budget_usd * KZT_PER_USD) / 100) * 100).toLocaleString("ru-KZ")} ₸.`
    : "";
  const reply = created
    ? `Нашёл: ${best.name} ⭐ ${best.rating}. Активной группы не было — я создал новую на ${best.group_threshold} мест, ты первый участник.${budgetNote} Зови друзей — чем больше группа, тем ниже цена!`
    : `Нашёл: ${best.name} ⭐ ${best.rating}. Уже есть группа ${group.current_members}/${group.threshold} — осталось ${Math.max(group.threshold - group.current_members, 0)} мест, цена уже снижена.${budgetNote} Вступай, пока группа не закрылась!`;

  return { reply, product: best, group, created, parsed };
}

/* ---------------------------------------------------------------- router */

export async function demoRequest<T>(path: string, init?: RequestInit): Promise<T> {
  // Tiny latency so optimistic-UI flows look identical to the real backend.
  await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 180));

  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const method = (init?.method ?? "GET").toUpperCase();
  const segments = pathname.split("/").filter(Boolean);
  const parseBody = <B>() => JSON.parse(String(init?.body ?? "{}")) as B;

  // auth + SIM/eSIM
  if (method === "POST" && pathname === "/auth/sim/request") return simRequest() as T;
  if (method === "POST" && pathname === "/auth/register") {
    return register(parseBody<RegisterRequest>()) as T;
  }
  if (method === "POST" && pathname === "/auth/login") {
    return login(parseBody<{ phone: string; password?: string; code?: string }>()) as T;
  }
  if (method === "GET" && pathname === "/auth/me") return me() as T;

  // seller cabinet
  if (pathname === "/seller/products" && method === "GET") return sellerList() as T;
  if (pathname === "/seller/products" && method === "POST") {
    return sellerCreate(parseBody<SellerProductInput>()) as T;
  }
  if (segments[0] === "seller" && segments[1] === "products" && segments.length === 3 && method === "DELETE") {
    return sellerDelete(segments[2]) as T;
  }

  if (method === "GET" && pathname === "/products") return listProducts(params) as T;
  if (method === "GET" && segments[0] === "products" && segments.length === 2) {
    return getProduct(segments[1]) as T;
  }
  if (method === "GET" && pathname === "/feed") return getFeed(params) as T;
  if (method === "GET" && pathname === "/groups") return listGroups() as T;
  if (method === "GET" && segments[0] === "groups" && segments.length === 2) {
    return getGroup(segments[1]) as T;
  }
  if (method === "POST" && segments[0] === "groups" && segments[2] === "join") {
    return joinGroup(segments[1]) as T;
  }
  if (method === "POST" && pathname === "/ai/buyer") {
    const { query } = JSON.parse(String(init?.body)) as { query: string };
    return aiBuyer(query) as T;
  }

  throw new Error(`Demo API: unknown route ${method} ${pathname}`);
}
