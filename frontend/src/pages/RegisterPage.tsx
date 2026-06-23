import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck, ShoppingBag, Store, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api, forceDemoMode } from "@/lib/api";
import { formatKzPhone } from "@/lib/utils";
import { useGroupBuyStore } from "@/lib/store";
import type { Currency, Role } from "@/types";

const CITIES = ["Almaty", "Astana", "Shymkent", "Other"];
const INTERESTS = ["gaming", "electronics", "fashion", "sports", "beauty", "home", "travel", "food"];

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useGroupBuyStore((s) => s.setSession);

  const [role, setRole] = useState<Role>("buyer");
  const [phone, setPhone] = useState("+7 ");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // buyer
  const [city, setCity] = useState("Almaty");
  const [budget, setBudget] = useState(120);
  const [interests, setInterests] = useState<string[]>(["electronics", "gadgets"]);
  // seller
  const [shopName, setShopName] = useState("");

  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(i: string) {
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  }

  async function sendCode() {
    setSending(true);
    setError(null);
    forceDemoMode(false); // prefer the real backend; demo only if offline
    try {
      const res = await api.simRequest(phone);
      setCodeSent(true);
      setDevCode(res.dev_code ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setSending(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.register({
        phone,
        code,
        role,
        name,
        password: password || undefined,
        city,
        interests,
        budget_usd: budget,
        currency_preference: "KZT" as Currency,
        language: "ru",
        shop_name: role === "seller" ? shopName : undefined
      });
      setSession({ token: res.token, user: res.user });
      navigate(role === "seller" ? "/seller" : "/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Регистрация не удалась");
    } finally {
      setSubmitting(false);
    }
  }

  const canSend = phone.replace(/\D/g, "").length >= 11 && !sending;
  const canSubmit =
    codeSent && code.trim().length >= 4 && name.trim().length > 0 && !submitting &&
    (role === "buyer" ? interests.length > 0 : shopName.trim().length > 0);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8 md:max-w-lg">
      <Link
        to="/"
        data-testid="to-landing"
        className="absolute left-4 top-5 inline-flex items-center gap-1 rounded-full bg-panel px-3 py-1.5 text-xs font-black text-inkSoft shadow-card ring-1 ring-black/5 transition-colors hover:text-primary"
      >
        <ChevronLeft size={15} />
        На главную
      </Link>
      <div className="text-center">
        <Badge tone="coral" className="gap-1">
          <Zap size={14} />
          Birge — вместе дешевле
        </Badge>
        <h1 className="mt-3 font-display text-2xl font-black leading-tight text-ink">
          Создай аккаунт <span className="text-fire">по SIM/eSIM</span>
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-inkSoft">
          1 номер = 1 человек = 1 место в группе. Без ботов и фейков.
        </p>
      </div>

      {/* Role */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: "buyer" as Role, label: "Покупатель", sub: "вступаю в группы", icon: ShoppingBag },
          { value: "seller" as Role, label: "Продавец", sub: "продаю товары", icon: Store }
        ].map(({ value, label, sub, icon: Icon }) => {
          const active = role === value;
          return (
            <button
              key={value}
              data-testid={`role-${value}`}
              onClick={() => setRole(value)}
              className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-[background-color,box-shadow,transform] active:scale-[0.98] ${
                active
                  ? "border-primary bg-fire-gradient text-white shadow-glow"
                  : "border-hairline bg-panel text-ink shadow-card"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-sm font-black">{label}</span>
              <span className={`text-[11px] font-semibold ${active ? "text-white/80" : "text-inkSoft"}`}>
                {sub}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="space-y-4">
        {/* Phone + send code */}
        <label htmlFor="reg-phone" className="block space-y-2 text-sm font-black text-ink">
          Номер телефона (Казахстан)
          <div className="flex gap-2">
            <input
              id="reg-phone"
              data-testid="phone-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              name="tel"
              className="w-full rounded-xl bg-panel px-3 py-3 tracking-wide text-ink outline-none ring-1 ring-black/5 transition-colors focus:ring-2 focus:ring-primary/30"
              placeholder="+7 7XX XXX XX XX…"
              value={phone}
              onChange={(e) => setPhone(formatKzPhone(e.target.value))}
            />
            <Button data-testid="send-code" className="shrink-0 px-4" disabled={!canSend} onClick={sendCode}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : codeSent ? "Ещё раз" : "Код"}
            </Button>
          </div>
        </label>

        {codeSent && (
          <div className="animate-slide-in-up space-y-4">
            <div className="rounded-xl border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-bold text-mint">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={13} /> Код «отправлен» на SIM/eSIM.
              </span>
              {devCode && (
                <span className="ml-1">
                  Демо-код: <b data-testid="dev-code">{devCode}</b> (в проде придёт по SMS)
                </span>
              )}
            </div>

            <label htmlFor="reg-code" className="block space-y-2 text-sm font-black text-ink">
              Код подтверждения
              <input
                id="reg-code"
                data-testid="code-input"
                autoComplete="one-time-code"
                inputMode="numeric"
                spellCheck={false}
                className="w-full rounded-xl bg-panel px-3 py-3 tracking-[0.3em] text-ink outline-none ring-1 ring-black/5 transition-colors focus:ring-2 focus:ring-primary/30"
                placeholder="______"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="reg-name" className="space-y-2 text-sm font-black text-ink">
                Имя
                <input
                  id="reg-name"
                  autoComplete="name"
                  name="name"
                  className="w-full rounded-xl bg-panel px-3 py-3 text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label htmlFor="reg-password" className="space-y-2 text-sm font-black text-ink">
                Пароль (для входа)
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    name="new-password"
                    className="w-full rounded-xl bg-panel px-3 py-3 pr-11 text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-inkSoft transition-colors hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            {role === "buyer" ? (
              <>
                <label htmlFor="reg-city" className="block space-y-2 text-sm font-black text-ink">
                  Город
                  <select
                    id="reg-city"
                    autoComplete="address-level2"
                    className="w-full rounded-xl bg-panel px-3 py-3 text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="reg-budget" className="block space-y-2 text-sm font-black text-ink">
                  Бюджет на сделки: <span className="tabular-nums">${budget}</span>
                  <input
                    id="reg-budget"
                    className="w-full accent-primary"
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                </label>
                <div className="space-y-2">
                  <p className="text-sm font-black text-ink">Что ловим в ленте</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        className={`rounded-full px-3 py-2 text-sm font-black transition-[background-color,box-shadow,transform] active:scale-95 ${
                          interests.includes(i)
                            ? "bg-fire-gradient text-white shadow-glow"
                            : "bg-panel text-ink ring-1 ring-black/5"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <label htmlFor="reg-shop" className="block space-y-2 text-sm font-black text-ink">
                Название магазина
                <input
                  id="reg-shop"
                  data-testid="shop-input"
                  autoComplete="organization"
                  className="w-full rounded-xl bg-panel px-3 py-3 text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                  placeholder="TechStore KZ"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </label>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm font-bold text-primary">{error}</p>
        )}

        <Button className="w-full" data-testid="register-submit" disabled={!canSubmit} onClick={submit}>
          {submitting ? "Создаём аккаунт…" : codeSent ? "Подтвердить и войти" : "Сначала получите код"}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-inkSoft">
          <Lock size={12} />
          Привязка к SIM/eSIM защищает группы от накруток.
        </p>
      </Card>

      <p className="text-center text-sm font-semibold text-inkSoft">
        Уже есть аккаунт?{" "}
        <Link to="/login" className="font-black text-primary">
          Войти
        </Link>
      </p>

      <div className="mx-auto flex max-w-xs items-center gap-2 rounded-xl bg-panel px-3 py-2 text-[11px] font-semibold text-inkSoft shadow-card ring-1 ring-black/5">
        <CheckCircle2 size={14} className="shrink-0 text-mint" />
        Тест: покупатель +7 700 000 0001 · продавец +7 700 000 0002 · пароль birge123
      </div>
    </div>
  );
}
