"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Навигационные ссылки приложения.
 * "use client" — нужен usePathname() для определения активного маршрута.
 */

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/tags", label: "Tags" },
  { href: "/reports", label: "Reports" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        // Для "/" — точное совпадение; для остальных — startsWith
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              isActive
                ? "bg-surface-3 text-text-1"
                : "text-text-2 hover:bg-surface-2 hover:text-text-1",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
