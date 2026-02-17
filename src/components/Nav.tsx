"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/events", label: "イベント" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/guide", label: "使い方" },
] as const;

export const Nav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold" style={{ color: "var(--accent)" }}>
          Marchen
        </Link>

        <div className="flex items-center gap-6">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors"
              style={{
                color: pathname === href ? "var(--accent)" : "var(--muted)",
                fontWeight: pathname === href ? 600 : 400,
              }}
            >
              {label}
            </Link>
          ))}

          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm transition-colors"
              style={{ color: "var(--muted)" }}
            >
              ログアウト
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm transition-colors"
              style={{
                color: pathname === "/login" ? "var(--accent)" : "var(--muted)",
                fontWeight: pathname === "/login" ? 600 : 400,
              }}
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
