"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/events", label: "イベント" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/guide", label: "使い方" },
] as const;

export const Nav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const icon = theme === "light" ? "🌞" : "🌙";
  const label = theme === "light" ? "ライト" : "ダーク";
  const logo = "/marchen.png";

  return (
    <nav className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--accent)" }}>
          <Image src={logo} alt="Marchen" width={96} height={32} priority className="h-8 w-auto object-contain" />
          <span className="hidden sm:inline">Marchen</span>
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

          {mounted && (
            <button
              onClick={toggleTheme}
              className="text-sm flex items-center gap-1 rounded-full px-3 py-1 transition-colors"
              style={{ color: "var(--muted)", border: "1px solid var(--border)", background: "var(--background)" }}
              aria-label="テーマ切り替え"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          )}

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
