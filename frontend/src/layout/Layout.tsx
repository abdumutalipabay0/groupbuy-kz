import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Database, Eye, LogIn } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { LiveActivity } from "@/components/ui/LiveActivity";
import { forceDemoMode } from "@/lib/api";
import { useGroupBuyStore } from "@/lib/store";
import { useRealNotifications } from "@/lib/useRealNotifications";

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [demoMode, setDemoMode] = useState(false);
  const theme = useGroupBuyStore((s) => s.theme);
  const preview = useGroupBuyStore((s) => s.preview);
  const clear = useGroupBuyStore((s) => s.clear);

  // Real notifications for logged-in users (preview uses scripted LiveActivity).
  useRealNotifications();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // The api layer dispatches this once when it falls back to the bundled demo
  // dataset (backend unreachable, or preview mode).
  useEffect(() => {
    const onDemo = () => setDemoMode(true);
    window.addEventListener("groupbuy:demo-mode", onDemo);
    return () => window.removeEventListener("groupbuy:demo-mode", onDemo);
  }, []);

  function exitPreview() {
    forceDemoMode(false);
    clear();
    navigate("/register", { replace: true });
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Перейти к содержимому
      </a>
      {preview && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-charcoal px-4 py-1.5 text-[11px] font-black text-white">
          <Eye size={13} />
          Превью без входа — данные демонстрационные
          <button
            onClick={exitPreview}
            className="ml-1 inline-flex items-center gap-1 rounded-full bg-fire-gradient px-2 py-0.5 text-[10px] font-black shadow-glow"
          >
            <LogIn size={11} />
            Создать аккаунт
          </button>
        </div>
      )}
      <main id="main-content" className={`min-h-screen bg-appBg text-ink ${preview ? "pt-7" : ""}`}>
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      {demoMode && !preview && (
        <div className="glass pointer-events-none fixed right-3 top-3 z-[60] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black text-stone-500 shadow-card ring-1 ring-black/5">
          <Database size={11} className="text-primary" />
          demo data
        </div>
      )}
      <BottomNav />
      {/* Scripted "live" toasts are part of the preview experience only. */}
      {preview && <LiveActivity />}
    </>
  );
}
