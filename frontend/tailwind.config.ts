import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — values live in src/index.css (:root / .dark)
        panel: "var(--surface)",
        panelSoft: "var(--surface-soft)",
        primary: "var(--accent)",
        primaryDeep: "var(--accent-deep)",
        coral: "var(--coral)",
        mint: "var(--mint)",
        appBg: "var(--bg)",
        coupon: "var(--gold)",
        ink: "var(--ink)",
        inkSoft: "var(--ink-soft)",
        // Fixed-dark surface — chips/overlays/banners that stay dark in both themes
        charcoal: "var(--charcoal)",
        hairline: "var(--border)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 10px 30px rgba(214, 67, 43, 0.32)",
        card: "0 1px 2px rgba(15,15,16,0.04), 0 12px 32px -16px rgba(15,15,16,0.16)",
        lift: "0 2px 4px rgba(15,15,16,0.05), 0 20px 44px -16px rgba(15,15,16,0.28)",
        nav: "0 2px 8px rgba(15,15,16,0.06), 0 16px 48px -8px rgba(15,15,16,0.28)"
      },
      backgroundImage: {
        "fire-gradient": "linear-gradient(135deg, #FF6B4A 0%, #D6432B 55%, #A8331F 100%)",
        "ink-gradient": "linear-gradient(140deg, #2A2119 0%, #15110D 70%)",
        "gold-gradient": "linear-gradient(135deg, #F2C572 0%, #E8B23D 100%)",
        "mint-gradient": "linear-gradient(135deg, #34D399 0%, #0EA371 100%)"
      }
    }
  },
  plugins: []
};

export default config;
