import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173,
    // host:true exposes the dev server on the LAN so the second phone in the
    // demo can reach it. Point VITE_API_URL at the laptop's LAN IP to match.
    host: true
  }
});
