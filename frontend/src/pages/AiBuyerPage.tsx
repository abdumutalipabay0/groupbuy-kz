import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Send, Sparkles, Users } from "lucide-react";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { api } from "@/lib/api";
import { DEMO_USER, useGroupBuyStore } from "@/lib/store";
import { formatPrice, savingsPct } from "@/lib/utils";
import type { AiBuyerResponse } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  result?: AiBuyerResponse;
}

const SUGGESTIONS = [
  "робот-пылесос до 80 000 ₸",
  "наушники до 30 000 ₸",
  "крем для лица",
  "что-нибудь для дома",
];

const GREETING =
  "Привет! Я твой AI-байер 🤖 Напиши, что ищешь и за какой бюджет — найду товар, подберу группу со скидкой или создам новую.";

export function AiBuyerPage() {
  const user = useGroupBuyStore((s) => s.userProfile) ?? DEMO_USER;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greeting", role: "assistant", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  async function ask(query: string) {
    const trimmed = query.trim();
    if (!trimmed || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
    setThinking(true);
    try {
      const result = await api.aiBuyer(trimmed, user.id);
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", text: result.reply, result },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: err instanceof Error ? `Что-то пошло не так: ${err.message}` : "Что-то пошло не так, попробуй ещё раз.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  const locale = user.currency_preference === "USD" ? "en-US" : "ru-KZ";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-40 md:max-w-2xl lg:max-w-3xl">
      {/* Header */}
      <header className="glass sticky top-0 z-30 border-b border-stone-200/60 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-fire-gradient text-white shadow-glow">
            <Bot size={21} />
          </span>
          <div>
            <h1 className="font-display text-base font-black leading-tight">AI-байер</h1>
            <p className="text-[11px] font-semibold text-stone-500">
              найдёт товар и группу по запросу
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary ring-1 ring-primary/15">
            <Sparkles size={10} />
            AI
          </span>
        </div>
      </header>

      {/* Chat */}
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 pt-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`animate-slide-in-up max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-medium leading-5 shadow-card ${
                msg.role === "user"
                  ? "rounded-br-md bg-fire-gradient text-white shadow-glow"
                  : "rounded-bl-md border border-stone-100 bg-white text-stone-800"
              }`}
            >
              {msg.text}
              {msg.result?.product && (
                <Link
                  to={`/product/${msg.result.product.id}`}
                  className="mt-3 block overflow-hidden rounded-xl border border-stone-100 bg-stone-50/60 transition hover:shadow-lift"
                >
                  <div className="flex gap-3 p-2.5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                      <ProductVisual product={msg.result.product} size="thumb" className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[13px] font-bold text-stone-900">
                        {msg.result.product.name}
                      </p>
                      {msg.result.group && (
                        <>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-base font-black text-primary">
                              {formatPrice(msg.result.group.price_current, user.currency_preference, locale)}
                            </span>
                            <span className="text-[11px] font-semibold text-stone-400 line-through">
                              {formatPrice(msg.result.product.price_individual, user.currency_preference, locale)}
                            </span>
                            <span className="text-[11px] font-black text-emerald-600">
                              -{savingsPct(msg.result.product.price_individual, msg.result.group.price_current)}%
                            </span>
                          </div>
                          <ProgressBar
                            value={(msg.result.group.current_members / msg.result.group.threshold) * 100}
                            className="mt-1.5 h-1.5"
                          />
                          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-stone-500">
                            <Users size={10} />
                            {msg.result.group.current_members}/{msg.result.group.threshold} в команде
                            {msg.result.created && (
                              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-black text-primary">
                                новая группа
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 border-t border-stone-100 bg-white py-2 text-xs font-black text-primary">
                    Открыть и вступить
                    <ArrowRight size={13} />
                  </div>
                </Link>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="animate-slide-in-up flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-stone-100 bg-white px-4 py-3 shadow-card">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions + input */}
      <div className="fixed inset-x-3 bottom-[86px] z-40">
        <div className="mx-auto max-w-md md:max-w-2xl lg:max-w-3xl">
          {messages.length <= 1 && (
            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="glass rounded-full px-3 py-1.5 text-xs font-bold text-stone-700 shadow-card ring-1 ring-black/5 transition-all hover:ring-primary/30 active:scale-95"
                  onClick={() => ask(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={onSubmit}
            className="glass flex items-center gap-2 rounded-2xl border border-white/60 p-2 shadow-nav"
          >
            <input
              className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-stone-800 placeholder-stone-400 outline-none"
              placeholder="Например: наушники до 30 000 ₸"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              data-testid="ai-input"
            />
            <button
              type="submit"
              data-testid="ai-send"
              disabled={thinking || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fire-gradient text-white shadow-glow transition-all active:scale-95 disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
