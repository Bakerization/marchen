import Link from "next/link";
import { getEvents } from "@/app/actions/events";

// Render this route on-demand to avoid hitting the DB during static prerender
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  OPEN: { label: "募集中", bg: "var(--success-light)", text: "var(--success)" },
  CLOSED: { label: "募集終了", bg: "var(--warning-light)", text: "var(--warning)" },
  COMPLETED: { label: "開催済み", bg: "var(--info-light)", text: "var(--info)" },
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">イベント一覧</h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          現在公開中のマルシェイベントです。ログインすると出店申請ができます。
        </p>
      </div>

      {events.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>まだイベントがありません。</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const status = STATUS_LABEL[event.status];
            return (
              <div
                key={event.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{event.title}</h2>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {new Date(event.eventDate).toLocaleString("ja-JP")} · {event.location ?? "未定"}
                    </p>
                    {event.description && (
                      <p className="text-sm line-clamp-2" style={{ color: "var(--muted)" }}>
                        {event.description}
                      </p>
                    )}
                  </div>
                  {status && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex justify-end gap-3 text-sm font-medium">
                  <Link
                    href={`/events/${event.id}`}
                    className="underline"
                    style={{ color: "var(--accent)" }}
                  >
                    詳細を見る
                  </Link>
                  <Link
                    href={`/events/${event.id}`}
                    style={{ color: "var(--accent)" }}
                  >
                    出店申請
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
