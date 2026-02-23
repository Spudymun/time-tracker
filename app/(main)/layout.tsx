import { TimerBar } from "@/components/timer/TimerBar";
import { NavLinks } from "@/components/ui/NavLinks";
import { UserMenu } from "@/components/ui/UserMenu";

/**
 * Main layout — шапка с TimerBar только для авторизованных маршрутов.
 * Применяется к: /, /projects, /reports, /tags.
 * Auth-страницы (/login, /register) используют (auth)/layout.tsx — без шапки.
 *
 * Именно этот layout решает проблему бесконечной петли:
 * TimerBar монтируется только здесь, а не в root layout, поэтому
 * /login никогда не вызывает initTimer() → apiFetch("/api/time-entries/active").
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-sm">
        {/* Строка навигации */}
        <div className="flex h-11 items-center gap-4 border-b border-border-subtle px-4">
          <span className="text-sm font-semibold text-text-1">⏱ Time Tracker</span>
          <NavLinks />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
        {/* Строка таймера */}
        <TimerBar />
      </header>
      <main className="min-h-screen">{children}</main>
    </>
  );
}
