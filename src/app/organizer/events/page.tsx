import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMyEvents } from "@/app/actions/events";
import { AppSidebarShell } from "@/components/AppSidebarShell";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:     { label: "下書き",   bg: "var(--accent-light)",   text: "var(--muted)",    dot: "var(--muted)" },
  OPEN:      { label: "募集中",   bg: "var(--success-light)",  text: "var(--success)",  dot: "var(--success)" },
  CLOSED:    { label: "募集終了", bg: "var(--warning-light)",  text: "var(--warning)",  dot: "var(--warning)" },
  COMPLETED: { label: "開催済み", bg: "var(--info-light)",     text: "var(--info)",     dot: "var(--info)" },
};

export default async function OrganizerEventsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const events = await getMyEvents();

  const openCount = events.filter((e) => e.status === "OPEN").length;
  const draftCount = events.filter((e) => e.status === "DRAFT").length;
  const totalApps = events.reduce((sum, e) => sum + e._count.applications, 0);

  return (
    <AppSidebarShell user={user}>
      <div className="space-y-8 py-2">

        {/* ── Header ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
            マイプロジェクト
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {user.name ? `${user.name}のイベント` : "マイイベント"}
          </h1>
          {events.length > 0 && (
            <div className="mt-2 flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
              <span>全 {events.length} 件</span>
              {openCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                  ● 募集中 {openCount}
                </span>
              )}
              {draftCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--accent-light)", color: "var(--muted)" }}>
                  下書き {draftCount}
                </span>
              )}
              {totalApps > 0 && <span>申請合計 {totalApps} 件</span>}
            </div>
          )}
        </div>

        {/* ── Action cards ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Create new event */}
          <Link
            href="/organizer/events/new"
            className="group flex flex-col gap-3 rounded-2xl p-6 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                ＋
              </span>
              <span className="text-xs font-semibold opacity-70 uppercase tracking-widest">NEW EVENT</span>
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">新規イベントを作成</p>
              <p className="mt-1 text-sm opacity-75 leading-relaxed">
                AIアシスタントと対話しながら、マルシェのイベントを一から計画します。
              </p>
            </div>
            <span className="self-end text-sm font-semibold opacity-90 group-hover:opacity-100">
              はじめる →
            </span>
          </Link>

          {/* AI consultation */}
          <Link
            href="/organizer/events/new"
            className="group flex flex-col gap-3 rounded-2xl p-6 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: "var(--accent-light)" }}>
                ✦
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>AI ASSIST</span>
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">AIに相談する</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                「この日にこの場所で」と話しかけるだけで、計画を自動で整理・提案します。
              </p>
            </div>
            <span className="self-end text-sm font-semibold" style={{ color: "var(--accent)" }}>
              相談する →
            </span>
          </Link>
        </div>

        {/* ── Event list ── */}
        {events.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-4xl mb-3">🍞</p>
            <p className="font-semibold text-lg">まだイベントがありません</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              上のボタンから最初のマルシェイベントを作成しましょう。
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              マイイベント一覧
            </h2>
            <div className="space-y-2">
              {events.map((event) => {
                const status = STATUS_CONFIG[event.status];
                return (
                  <div
                    key={event.id}
                    className="group flex items-center gap-4 rounded-xl px-5 py-4"
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    {/* Status dot */}
                    <span
                      className="hidden sm:block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: status?.dot ?? "var(--muted)" }}
                    />

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/organizer/events/${event.id}/applications`}
                        className="font-semibold hover:underline truncate block"
                        style={{ color: "var(--foreground)" }}
                      >
                        {event.title}
                      </Link>
                      <p className="mt-0.5 text-xs truncate" style={{ color: "var(--muted)" }}>
                        {new Date(event.eventDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                        {event.location && ` · ${event.location}`}
                        {` · 申請 ${event._count.applications} 件`}
                      </p>
                    </div>

                    {/* Status badge */}
                    {status && (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                    )}

                    {/* Quick links */}
                    <div className="shrink-0 hidden sm:flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                      {event.status === "DRAFT" && (
                        <Link
                          href={`/organizer/events/${event.id}/chat`}
                          className="hover:underline font-medium"
                          style={{ color: "var(--accent)" }}
                        >
                          AIと続きを作る
                        </Link>
                      )}
                      <Link href={`/organizer/events/${event.id}/applications`} className="hover:underline">
                        申請管理
                      </Link>
                      <Link href={`/organizer/events/${event.id}/next-steps`} className="hover:underline">
                        次やること
                      </Link>
                      <Link href={`/organizer/events/${event.id}/plan`} className="hover:underline">
                        計画
                      </Link>
                      {event.status === "DRAFT" && (
                        <Link
                          href={`/organizer/events/${event.id}/edit`}
                          className="hover:underline"
                        >
                          編集
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Photo settings shortcut ── */}
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>イベント写真・パン屋写真の管理</p>
          <Link href="/dashboard/media" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            写真設定 →
          </Link>
        </div>

      </div>
    </AppSidebarShell>
  );
}
