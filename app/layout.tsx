import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { TimerBar } from "@/components/timer/TimerBar";

/**
 * Geist — шрифт Vercel (open-source, 2024).
 * Переменная --font-sans — подключается к Tailwind через @theme в globals.css.
 * Geist Mono — для TimerDisplay: tabular-nums, нет прыжков цифр.
 */
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Time Tracker",
  description: "Веб-приложение для учёта рабочего времени",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-bg font-sans text-text-1 antialiased">
        <ToastProvider>
          <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-sm">
            <TimerBar />
          </header>
          <main className="min-h-screen">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
