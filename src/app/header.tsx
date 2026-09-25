"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type HeaderUser = { name: string; role: string } | null;

export function Header({ user }: { user: HeaderUser }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-olive" aria-hidden>
            <span className="h-1 w-3.5 rounded-full bg-signal" />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">Опитування</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-2 sm:gap-3">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-lg bg-olive px-2.5 py-2 text-sm font-medium text-olive-ink transition-opacity hover:opacity-90 sm:px-3.5"
              >
                <ShieldIcon />
                <span className="hidden sm:inline">Панель</span>
              </Link>
            )}
            <span className="hidden max-w-[11rem] truncate text-sm text-muted md:inline" title={user.name}>
              {user.name}
            </span>
            <button
              type="button"
              onClick={signOut}
              aria-label="Вийти"
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-sm text-muted transition-colors hover:bg-paper hover:text-ink sm:px-3.5"
            >
              <span className="hidden sm:inline">Вийти</span>
              <LogoutIcon />
            </button>
          </nav>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-lg bg-olive px-4 py-2 text-sm font-medium text-olive-ink transition-opacity hover:opacity-90"
          >
            Увійти
          </Link>
        )}
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5 2.75 3.5v3.4c0 3.2 2.1 5.6 5.25 6.6 3.15-1 5.25-3.4 5.25-6.6V3.5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="sm:hidden">
      <path d="M6 2.5H3.5v11H6M10 11l3-3-3-3M13 8H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
