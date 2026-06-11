import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#2B1210",
        panel: "#FFFFFF",
        panelSoft: "#FFF0D9",
        primary: "#E60012",
        coral: "#FF5A1F",
        mint: "#12B981",
        appBg: "#FFF5E8",
        pddRed: "#E60012",
        hotRed: "#FF2D1D",
        coupon: "#FFE15A",
        ink: "#2B1210"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 10px 30px rgba(230, 0, 18, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
