import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getMyEvents } from "@/app/actions/events";

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: "下書き", bg: "var(--accent-light)", text: "var(--muted)" },
  OPEN: { label: "募集中", bg: "var(--success-light)", text: "var(--success)" },
  CLOSED: { label: "募集終了", bg: "var(--warning-light)", text: "var(--warning)" },
  COMPLETED: { label: "開催済み", bg: "var(--info-light)", text: "var(--info)" },
};

export default async function OrganizerEventsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const events = await getMyEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マイイベント</h1>
        <Link
          href="/organizer/events/new"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          新規イベント作成
        </Link>
      </div>

      {events.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          まだイベントがありません。最初のイベントを作成しましょう。
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const status = STATUS_LABEL[event.status];
            return (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl p-4"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div>
                  <Link
                    href={`/organizer/events/${event.id}/applications`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {event.title}
                  </Link>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    {new Date(event.eventDate).toLocaleDateString("ja-JP")} &middot;{" "}
                    {event._count.applications}件の申請
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {status && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  )}
                  <Link
                    href={`/organizer/events/${event.id}/chat`}
                    className="text-sm"
                    style={{ color: "var(--accent)" }}
                  >
                    AIチャット
                  </Link>
                  {event.status === "DRAFT" && (
                    <Link
                      href={`/organizer/events/${event.id}/edit`}
                      className="text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      編集
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
