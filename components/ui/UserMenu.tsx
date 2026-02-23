"use client";

/**
 * UserMenu — аватар/инициалы пользователя с дропдауном в хедере.
 * Показывает: имя + аватар → дропдаун: email (muted), разделитель, "Sign out".
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => (word[0] ?? "").toUpperCase())
    .join("");
}

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  // Закрыть дропдаун при клике вне компонента
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Закрыть по Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  if (!user) return null;

  const initials = getInitials(user.name);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "flex items-center gap-2 rounded-md px-2 py-1 text-sm",
          "text-text-1 transition-colors duration-150",
          "hover:bg-surface-2",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-fg">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User avatar"}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </span>

        {/* Name — скрываем на очень маленьких экранах */}
        <span className="hidden max-w-[120px] truncate sm:block">{user.name ?? user.email}</span>
        <ChevronDown
          className={`h-3 w-3 text-text-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className={[
            "absolute top-full right-0 mt-1 w-52 rounded-lg border border-border",
            "bg-surface shadow-lg",
            "z-50",
          ].join(" ")}
        >
          {/* User info */}
          <div className="px-4 py-3">
            {user.name && <p className="truncate text-sm font-medium text-text-1">{user.name}</p>}
            {user.email && <p className="truncate text-xs text-text-3">{user.email}</p>}
          </div>

          <div className="border-t border-border" />

          {/* Sign out */}
          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className={[
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
                "text-text-2 transition-colors duration-150",
                "hover:bg-surface-2 hover:text-text-1",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              ].join(" ")}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
