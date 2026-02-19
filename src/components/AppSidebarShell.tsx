"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SessionUserLite = {
  name: string | null;
  email: string;
  role: string;
} | null;

type NavItem = {
  id: "projects" | "events" | "media" | "guide";
  label: string;
  href: string;
  show: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "管理者",
  ORGANIZER: "主催者",
  VENDOR: "出店者",
};

const isActivePath = (pathname: string, id: NavItem["id"]) => {
  if (id === "projects") return pathname.startsWith("/organizer/events");
  if (id === "events") return pathname.startsWith("/events");
  if (id === "media") return pathname.startsWith("/dashboard/media");
  if (id === "guide") return pathname.startsWith("/guide");
  return false;
};

export const AppSidebarShell = ({
  user,
  children,
}: {
  user: SessionUserLite;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  const isOrganizerLike = user?.role === "ORGANIZER" || user?.role === "ADMIN";

  const navItems: NavItem[] = [
    { id: "projects", label: "Projects", href: "/organizer/events", show: Boolean(isOrganizerLike) },
    { id: "events", label: "Events", href: "/events", show: true },
    { id: "media", label: "Media", href: "/dashboard/media", show: true },
    { id: "guide", label: "Guide", href: "/guide", show: true },
  ];

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 min-h-[calc(100vh-3.5rem)]">
      <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside
          className="border-r p-3"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="mb-3 rounded-lg px-3 py-2" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{user?.name ?? user?.email ?? "Guest"}</p>
            <p className="text-sm font-medium">{ROLE_LABEL[user?.role ?? ""] ?? "未ログイン"}</p>
          </div>

          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--muted)" }}>
            Find...
          </div>

          <nav className="space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const active = isActivePath(pathname, item.id);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-[var(--accent)] hover:bg-[var(--accent-light)]"
                    style={{
                      color: active ? "var(--accent)" : "var(--foreground)",
                      backgroundColor: active ? "var(--accent-light)" : "transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </aside>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

