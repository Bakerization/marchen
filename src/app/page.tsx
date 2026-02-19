import Image from "next/image";
import Link from "next/link";
import { getEvents } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await getEvents();
  const openEvents = events.filter((e) => e.status === "OPEN");
  const upcoming = events.filter((e) => e.status !== "COMPLETED").slice(0, 7);
  const featuredEvent = openEvents[0] ?? upcoming[0];
  const gridEvents = upcoming.filter((e) => e.id !== featuredEvent?.id).slice(0, 3);

  return (
    <div>
      {/* ── Full-bleed hero ── */}
      <div className="-mx-4 -mt-8 relative overflow-hidden" style={{ height: "540px" }}>
        <Image
          src="/hero.png"
          alt="パンマルシェ"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-5xl mx-auto">
          {openEvents.length > 0 && (
            <span
              className="mb-4 self-start inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "rgba(107,158,72,0.35)", border: "1px solid rgba(107,158,72,0.55)", color: "#a8d880" }}
            >
              ● 募集中 {openEvents.length} 件
            </span>
          )}
          <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
            パンマルシェ、<br />開いてみませんか？
          </h1>
          <p className="mt-3 text-lg max-w-lg" style={{ color: "rgba(255,255,255,0.75)" }}>
            地方公共団体とパン屋をつなぐ、マルシェ運営プラットフォーム。AIアシスタントが企画から報告書作成まで全てサポートします。
          </p>
          <div className="mt-7 flex items-center gap-3 flex-wrap">
            <Link
              href="/events"
              className="rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              イベントを見る
            </Link>
            <Link
              href="/login"
              className="rounded-full px-6 py-2.5 text-sm font-semibold"
              style={{ border: "1px solid rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.9)", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              ログイン
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live events section ── */}
      {upcoming.length > 0 ? (
        <section className="mt-14 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                UPCOMING
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">開催予定のマルシェ</h2>
            </div>
            <Link href="/events" className="text-sm shrink-0" style={{ color: "var(--accent)" }}>
              すべて見る →
            </Link>
          </div>

          {/* Featured */}
          {featuredEvent && (
            <Link
              href={`/events/${featuredEvent.id}`}
              className="group block overflow-hidden rounded-2xl"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="relative w-full overflow-hidden" style={{ height: "280px", backgroundColor: "var(--card)" }}>
                {featuredEvent.photos[0]?.imageUrl ? (
                  <Image
                    src={featuredEvent.photos[0].imageUrl}
                    alt={featuredEvent.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl" style={{ backgroundColor: "var(--accent-light)" }}>
                    🍞
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  {featuredEvent.status === "OPEN" && (
                    <span
                      className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "var(--success)", color: "white" }}
                    >
                      ● 募集中
                    </span>
                  )}
                  <h3 className="text-2xl font-bold drop-shadow">{featuredEvent.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {new Date(featuredEvent.eventDate).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {featuredEvent.location && ` · ${featuredEvent.location}`}
                  </p>
                  {featuredEvent.description && (
                    <p className="mt-2 text-sm line-clamp-2 max-w-xl" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {featuredEvent.description}
                    </p>
                  )}
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    詳細を見る →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          {gridEvents.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridEvents.map((event) => {
                const cover = event.photos[0]?.imageUrl;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group flex flex-col overflow-hidden rounded-xl transition-opacity hover:opacity-90"
                    style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                  >
                    <div className="relative h-44 w-full overflow-hidden" style={{ backgroundColor: "var(--accent-light)" }}>
                      {cover ? (
                        <Image
                          src={cover}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🍞</div>
                      )}
                      {event.status === "OPEN" && (
                        <div className="absolute top-3 left-3">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}
                          >
                            ● 募集中
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 p-4">
                      <h3 className="font-semibold leading-snug line-clamp-2">{event.title}</h3>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {new Date(event.eventDate).toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-14 rounded-2xl p-10 text-center" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <p className="text-4xl mb-3">🍞</p>
          <p className="font-medium">近日中にマルシェが掲載されます</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>開催予定のマルシェをお待ちください。</p>
        </section>
      )}

      {/* ── Platform features ── */}
      <section
        className="mt-16 grid sm:grid-cols-3 overflow-hidden rounded-2xl"
        style={{ border: "1px solid var(--border)", gap: "1px", backgroundColor: "var(--border)" }}
      >
        {[
          {
            icon: "📋",
            title: "企画から運営まで",
            desc: "AIチャットアシスタントが、マルシェの企画・パン屋の選定・日程調整・当日運営まで全てサポート。",
          },
          {
            icon: "🍞",
            title: "パン屋さんとつながる",
            desc: "出店申請・審査・確認まで、シンプルな操作でパン屋さんとスムーズに連携できます。",
          },
          {
            icon: "📊",
            title: "報告書も自動作成",
            desc: "活動報告書から会計書類まで、地方公共団体に必要な書類をワンクリックで出力。",
          },
        ].map((f) => (
          <div key={f.title} className="p-6 space-y-2" style={{ backgroundColor: "var(--card)" }}>
            <p className="text-2xl">{f.icon}</p>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ── Organizer CTA ── */}
      <section
        className="mt-12 mb-8 rounded-2xl px-8 py-12 text-center"
        style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent)" }}>
          FOR ORGANIZERS
        </p>
        <h2 className="text-2xl font-bold tracking-tight">マルシェを主催してみませんか？</h2>
        <p className="mt-2 text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
          AIアシスタントが企画段階からサポート。申請管理から報告書作成まで、ひとつのプラットフォームで完結します。
        </p>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login"
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            はじめる
          </Link>
          <Link
            href="/guide"
            className="rounded-full px-6 py-2.5 text-sm font-semibold"
            style={{ border: "1px solid var(--border-dark)", color: "var(--foreground)" }}
          >
            使い方を見る
          </Link>
        </div>
      </section>
    </div>
  );
}
