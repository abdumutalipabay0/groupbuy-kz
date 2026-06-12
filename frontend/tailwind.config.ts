import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#2B1210",
        panel: "#FFFFFF",
        panelSoft: "#F8F8F8",
        primary: "#E60012",
        primaryDeep: "#B3000E",
        hot: "#FF3B30",
        coral: "#FF5A1F",
        mint: "#12B981",
        appBg: "#F6F6F7",
        pddRed: "#E60012",
        hotRed: "#FF2D1D",
        coupon: "#FFE15A",
        ink: "#0F0F10"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Unbounded", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 10px 30px rgba(230, 0, 18, 0.30)",
        card: "0 1px 2px rgba(15,15,16,0.04), 0 12px 32px -16px rgba(15,15,16,0.16)",
        lift: "0 2px 4px rgba(15,15,16,0.05), 0 20px 44px -16px rgba(15,15,16,0.28)",
        nav: "0 2px 8px rgba(15,15,16,0.06), 0 16px 48px -8px rgba(15,15,16,0.28)"
      },
      backgroundImage: {
        "fire-gradient": "linear-gradient(135deg, #FF3B30 0%, #E60012 55%, #B3000E 100%)",
        "ink-gradient": "linear-gradient(140deg, #26262A 0%, #0F0F10 70%)",
        "gold-gradient": "linear-gradient(135deg, #FFE15A 0%, #FFC93C 100%)",
        "mint-gradient": "linear-gradient(135deg, #34D399 0%, #0EA371 100%)"
      }
    }
  },
  plugins: []
};

export default config;
