import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api, forceDemoMode } from "@/lib/api";
import { formatKzPhone } from "@/lib/utils";
import { useGroupBuyStore } from "@/lib/store";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useGroupBuyStore((s) => s.setSession);

  const [mode, setMode] = useState<"password" | "code">("password");
  const [phone, setPhone] = useState("+7 ");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    forceDemoMode(false);
    try {
      const res = await api.simRequest(phone, "login");
      setCodeSent(true);
      setDevCode(res.dev_code ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    forceDemoMode(false); // prefer the real backend; falls back to demo only if offline
    try {
      const res = await api.login(phone, mode === "password" ? { password } : { code });
      setSession({ token: res.token, user: res.user });
      navigate(res.user.role === "seller" ? "/seller" : "/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
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
          <LogIn size={14} />
          Birge
        </Badge>
        <h1 className="mt-3 font-display text-2xl font-black leading-tight text-ink">С возвращением 👋</h1>
        <p className="mt-1.5 text-sm font-semibold text-inkSoft">Войди по паролю или по SMS-коду</p>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-panelSoft p-1">
          {[
            { value: "password" as const, label: "Пароль" },
            { value: "code" as const, label: "SMS-код" }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`rounded-lg py-2 text-sm font-black transition-colors ${
                mode === value ? "bg-panel text-primary shadow-sm" : "text-inkSoft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label htmlFor="login-phone" className="block space-y-2 text-sm font-black text-ink">
          Номер телефона
          <input
            id="login-phone"
            data-testid="login-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            name="tel"
            className="w-full rounded-xl bg-panel px-3 py-3 tracking-wide text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
            placeholder="+7 7XX XXX XX XX…"
            value={phone}
            onChange={(e) => setPhone(formatKzPhone(e.target.value))}
          />
        </label>

        {mode === "password" ? (
          <label htmlFor="login-password" className="block space-y-2 text-sm font-black text-ink">
            Пароль
            <div className="relative">
              <input
                id="login-password"
                data-testid="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                name="password"
                className="w-full rounded-xl bg-panel px-3 py-3 pr-11 text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                data-testid="toggle-password"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-inkSoft transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        ) : (
          <div className="space-y-2">
            <label htmlFor="login-code" className="sr-only">
              Код из SMS
            </label>
            <div className="flex gap-2">
              <input
                id="login-code"
                autoComplete="one-time-code"
                inputMode="numeric"
                spellCheck={false}
                className="w-full rounded-xl bg-panel px-3 py-3 tracking-[0.3em] text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
                placeholder="______"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button className="shrink-0 px-4" variant="secondary" disabled={busy} onClick={sendCode}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Код"}
              </Button>
            </div>
            {codeSent && devCode && (
              <p className="text-xs font-bold text-mint">
                Демо-код: <b>{devCode}</b>
              </p>
            )}
          </div>
        )}

        {error && <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm font-bold text-primary">{error}</p>}

        <Button className="w-full" data-testid="login-submit" disabled={busy} onClick={submit}>
          {busy ? "Входим…" : "Войти"}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-inkSoft">
          <ShieldCheck size={12} />
          Тест: +7 700 000 0001 / birge123 (покупатель) · 0002 (продавец)
        </p>
      </Card>

      <p className="text-center text-sm font-semibold text-inkSoft">
        Нет аккаунта?{" "}
        <Link to="/register" className="font-black text-primary">
          Создать по SIM
        </Link>
      </p>
    </div>
  );
}
