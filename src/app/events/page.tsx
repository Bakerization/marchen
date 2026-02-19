import Link from "next/link";
import Image from "next/image";
import { getEvents } from "@/app/actions/events";
import { getSessionUser } from "@/lib/session";
import { AppSidebarShell } from "@/components/AppSidebarShell";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:      { label: "募集中",   bg: "var(--success-light)", color: "var(--success)" },
  CLOSED:    { label: "募集終了", bg: "var(--warning-light)", color: "var(--warning)" },
  COMPLETED: { label: "開催済み", bg: "var(--info-light)",    color: "var(--info)" },
};

export default async function EventsPage() {
  const user   = await getSessionUser();
  const events = await getEvents();

  const open      = events.filter((e) => e.status === "OPEN");
  const others    = events.filter((e) => e.status !== "OPEN");
  const featured  = open[0];
  const gridEvents= [...open.slice(1), ...others];

  return (
    <AppSidebarShell user={user}>
      <div className="space-y-10 py-2">

        {/* Page header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">マルシェ一覧</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              現在公開中のパンマルシェイベントです。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
              ● 募集中 {open.length}
            </span>
            <span>全 {events.length} 件</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <p className="text-4xl mb-3">🍞</p>
            <p className="font-medium">まだイベントがありません</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>近日中に開催予定のマルシェが掲載されます。</p>
          </div>
        ) : (
          <>
            {/* ── Featured (first open event) ── */}
            {featured && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>注目のマルシェ</p>
                <Link href={`/events/${featured.id}`} className="group block overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                  <div className="relative h-72 w-full overflow-hidden" style={{ backgroundColor: "var(--card)" }}>
                    {featured.photos[0]?.imageUrl ? (
                      <Image src={featured.photos[0].imageUrl} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">🍞</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 text-white">
                      <div className="mb-2">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: "var(--success)", color: "white" }}>
                          ● 募集中
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold drop-shadow">{featured.title}</h2>
                      <p className="mt-1 text-sm text-white/80">
                        {new Date(featured.eventDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                        {featured.location && ` · ${featured.location}`}
                      </p>
                      {featured.description && (
                        <p className="mt-2 text-sm text-white/70 line-clamp-2 max-w-xl">{featured.description}</p>
                      )}
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="rounded-full px-4 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>詳細を見る →</span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* ── Grid of remaining events ── */}
            {gridEvents.length > 0 && (
              <section>
                {featured && <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>すべてのマルシェ</p>}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {gridEvents.map((event) => {
                    const status = STATUS_CONFIG[event.status];
                    const cover  = event.photos[0]?.imageUrl;
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="group flex flex-col overflow-hidden rounded-xl transition-opacity hover:opacity-90"
                        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                      >
                        {/* Image */}
                        <div className="relative h-44 w-full overflow-hidden" style={{ backgroundColor: "var(--accent-light)" }}>
                          {cover ? (
                            <Image src={cover} alt={event.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl">🍞</div>
                          )}
                          {status && (
                            <div className="absolute top-3 left-3">
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
                                {status.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-1 p-4">
                          <h2 className="font-semibold leading-snug line-clamp-2">{event.title}</h2>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                            {new Date(event.eventDate).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                            {event.location && ` · ${event.location}`}
                          </p>
                          {event.description && (
                            <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--muted)" }}>{event.description}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppSidebarShell>
  );
}
