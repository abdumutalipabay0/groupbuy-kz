import type { Metadata } from "next";
import "./globals.css";
import { LiveActivity } from "@/components/ui/LiveActivity";

export const metadata: Metadata = {
  title: "GroupBuy KZ — собери команду, сбей цену",
  description: "Pinduoduo-механика для Казахстана. Зови друзей, снижай цену командой."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <main className="min-h-screen bg-appBg text-ink">{children}</main>
        <LiveActivity />
      </body>
    </html>
  );
}
