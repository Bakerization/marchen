"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export const Nav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          Marchen
        </Link>

        <div className="flex items-center gap-6">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors hover:text-gray-900 dark:hover:text-gray-100 ${
                pathname === href
                  ? "font-medium text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </Link>
          ))}

          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className={`text-sm transition-colors hover:text-gray-900 dark:hover:text-gray-100 ${
                pathname === "/login"
                  ? "font-medium text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
