import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Package, Plus, Store, Trash2 } from "lucide-react";
import { ProductVisual } from "@/components/product/ProductVisual";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useGroupBuyStore } from "@/lib/store";
import { formatPrice, savingsPct } from "@/lib/utils";
import type { Currency, Product } from "@/types";

const CATEGORIES = ["Electronics", "Fashion", "Home", "Sports", "Beauty", "Food"];

const EMPTY = {
  name: "",
  category: "Electronics",
  description: "",
  price_individual: "",
  price_group_min: "",
  group_threshold: "10",
  tags: "",
  image_url: ""
};

export function SellerAdminPage() {
  const user = useGroupBuyStore((s) => s.userProfile);
  const currency = (user?.currency_preference ?? "KZT") as Currency;
  const locale = currency === "USD" ? "en-US" : "ru-KZ";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setProducts(await api.sellerProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить товары");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addProduct(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.createSellerProduct({
        name: form.name,
        category: form.category,
        description: form.description,
        price_individual: Number(form.price_individual),
        price_group_min: Number(form.price_group_min),
        group_threshold: Number(form.group_threshold),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        image_url: form.image_url
      });
      setProducts((p) => [created, ...p]);
      setForm({ ...EMPTY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить товар");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    try {
      await api.deleteSellerProduct(id);
    } catch {
      setProducts(prev); // rollback on failure
      setError("Не удалось удалить товар");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-28 lg:max-w-5xl">
      <header className="relative overflow-hidden rounded-b-3xl bg-ink-gradient px-4 py-5 text-white shadow-lift lg:mx-4 lg:mt-4 lg:rounded-3xl">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-black text-white/90 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <ArrowLeft size={16} />
            Лента
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fire-gradient shadow-glow">
              <Store size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-xl font-black leading-tight">Кабинет продавца</h1>
              <p className="text-sm font-bold text-white/70">{user?.shop_name || user?.name || "Мой магазин"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="lg:mx-4 lg:mt-4 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-4">
        {/* Add product */}
        <section className="mx-4 mt-4 rounded-2xl border border-hairline bg-panel p-4 shadow-card lg:mx-0 lg:mt-0">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-primary" aria-hidden="true" />
            <h2 className="text-base font-black text-ink">Добавить товар</h2>
          </div>
          <form className="mt-3 space-y-3" onSubmit={addProduct}>
            <input
              required
              data-testid="seller-name"
              aria-label="Название товара"
              autoComplete="off"
              className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
              placeholder="Название товара"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              aria-label="Описание товара"
              className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
              placeholder="Описание (необязательно)"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs font-bold text-inkSoft">
                Розница, $
                <input
                  required
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  data-testid="seller-price"
                  className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                  value={form.price_individual}
                  onChange={(e) => setForm({ ...form, price_individual: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-inkSoft">
                Опт (мин), $
                <input
                  required
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  data-testid="seller-price-min"
                  className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                  value={form.price_group_min}
                  onChange={(e) => setForm({ ...form, price_group_min: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-inkSoft">
                Категория
                <select
                  className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-bold text-inkSoft">
                Мин. группа
                <input
                  type="number"
                  min={2}
                  inputMode="numeric"
                  className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                  value={form.group_threshold}
                  onChange={(e) => setForm({ ...form, group_threshold: e.target.value })}
                />
              </label>
            </div>
            <input
              aria-label="Теги через запятую"
              autoComplete="off"
              className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
              placeholder="Теги через запятую: electronics, gadgets"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
            <input
              aria-label="URL картинки"
              autoComplete="off"
              type="url"
              className="w-full rounded-xl bg-panelSoft px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
              placeholder="URL картинки (необязательно)"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
            {error && <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm font-bold text-primary">{error}</p>}
            <Button className="w-full" data-testid="seller-add" disabled={saving} icon={<Plus size={16} />}>
              {saving ? "Добавляем…" : "Добавить товар"}
            </Button>
          </form>
        </section>

        {/* My products */}
        <section className="mx-4 mt-4 rounded-2xl border border-hairline bg-panel p-4 shadow-card lg:mx-0 lg:mt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-ink" aria-hidden="true" />
              <h2 className="text-base font-black text-ink">Мои товары</h2>
            </div>
            <span className="rounded-full bg-panelSoft px-2.5 py-1 text-xs font-bold text-inkSoft tabular-nums">
              {products.length}
            </span>
          </div>

          {loading ? (
            <div className="grid place-items-center py-10 text-primary">
              <Loader2 className="animate-spin" aria-label="Загрузка" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-inkSoft">
              Пока нет товаров. Добавьте первый — к нему сразу создастся группа.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-hairline bg-panelSoft/60 p-2.5"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-panel">
                    <ProductVisual product={p} size="thumb" className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-ink">{p.name}</p>
                    <p className="text-xs font-semibold text-inkSoft tabular-nums">
                      {formatPrice(p.price_group_min, currency, locale)}
                      <span className="ml-1 text-inkSoft line-through">
                        {formatPrice(p.price_individual, currency, locale)}
                      </span>
                      <span className="ml-1 text-mint">
                        -{savingsPct(p.price_individual, p.price_group_min)}%
                      </span>
                    </p>
                  </div>
                  <button
                    data-testid={`seller-delete-${p.id}`}
                    onClick={() => remove(p.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-panel text-inkSoft ring-1 ring-black/5 transition-colors hover:text-primary active:scale-95"
                    aria-label="Удалить товар"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
