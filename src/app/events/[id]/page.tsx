import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getEvent } from "@/app/actions/events";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ApplyForm } from "./ApplyForm";
import { VolunteerApplyForm } from "./VolunteerApplyForm";

// Avoid static prerender so DB isn't required at build time
export const dynamic = "force-dynamic";

const EVENT_PHOTO_LABEL: Record<string, string> = {
  HERO: "ヒーロー画像",
  VENUE: "会場写真",
  MAP: "マップ画像",
  POSTER: "ポスター",
  GALLERY: "ギャラリー",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "イベントが見つかりません" };

  return {
    title: `${event.title} | Marchen`,
    description: event.description ?? `${event.title} - ${event.organizer.organizationName}`,
    openGraph: {
      title: event.title,
      description: event.description ?? undefined,
      type: "website",
      images: event.photos[0]?.imageUrl ? [{ url: event.photos[0].imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description ?? undefined,
      images: event.photos[0]?.imageUrl ? [event.photos[0].imageUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const user = await getSessionUser();
  const isOpen = event.status === "OPEN";

  const acceptedApps = await prisma.application.findMany({
    where: { eventId: id, status: "ACCEPTED" },
    include: {
      vendor: {
        include: {
          photos: {
            where: { type: { in: ["LOGO", "PRODUCT", "SHOP"] } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const photosByType = event.photos.reduce<Record<string, typeof event.photos>>((acc, photo) => {
    if (!acc[photo.type]) acc[photo.type] = [];
    acc[photo.type].push(photo);
    return acc;
  }, {});

  return (
    <div className="py-12 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {new Date(event.eventDate).toLocaleString("ja-JP")} · {event.location ?? "未定"}
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            申請締切: {new Date(event.deadline).toLocaleString("ja-JP")} · ステータス: {event.status}
          </p>
          {event.description && (
            <p className="text-base whitespace-pre-line">
              {event.description}
            </p>
          )}
        </div>
        <div className="text-right text-sm" style={{ color: "var(--muted)" }}>
          <p>主催</p>
          <p className="font-medium" style={{ color: "var(--foreground)" }}>{event.organizer.organizationName}</p>
          {event.organizer.website && (
            <Link
              href={event.organizer.website}
              style={{ color: "var(--accent)" }}
            >
              ウェブサイト
            </Link>
          )}
        </div>
      </div>

      {event.photos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">イベント写真</h2>
          <div className="space-y-4">
            {Object.entries(photosByType).map(([type, photos]) => (
              <div key={type} className="space-y-2">
                <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                  {EVENT_PHOTO_LABEL[type] ?? type}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <figure
                      key={photo.id}
                      className="overflow-hidden rounded-xl"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                    >
                      <div className="relative h-44 w-full">
                        <Image src={photo.imageUrl} alt={photo.caption ?? event.title} fill className="object-cover" />
                      </div>
                      {photo.caption && (
                        <figcaption className="p-2 text-sm" style={{ color: "var(--muted)" }}>
                          {photo.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 出店者一覧 */}
      {acceptedApps.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold mb-3">出店者一覧</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {acceptedApps.map((app) => (
              <div
                key={app.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: "var(--accent-lighter)", border: "1px solid var(--border)" }}
              >
                {app.vendor.photos[0]?.imageUrl && (
                  <div className="relative mb-2 h-28 w-full overflow-hidden rounded-md">
                    <Image src={app.vendor.photos[0].imageUrl} alt={app.vendor.shopName} fill className="object-cover" />
                  </div>
                )}
                <Link href={`/bakeries/${app.vendor.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                  {app.vendor.shopName}
                </Link>
                {app.vendor.category && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{app.vendor.category}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 出店申請 */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-semibold">出店申請</h2>
        {!user && (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            出店申請するには<Link href="/login" className="underline" style={{ color: "var(--accent)" }}>ログイン</Link>してください。
          </p>
        )}
        {user && user.role !== "VENDOR" && (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            出店者アカウントのみ申請できます。現在のアカウント: {user.role}
          </p>
        )}
        {user && user.role === "VENDOR" && (
          <div className="mt-3">
            <ApplyForm eventId={event.id} deadlineIso={event.deadline.toISOString()} isOpen={isOpen} />
          </div>
        )}
      </div>

      {/* ボランティア募集 */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-lg font-semibold">ボランティア募集</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          イベント運営のお手伝いをしてくださる方を募集しています。
        </p>
        <div className="mt-3">
          <VolunteerApplyForm eventId={event.id} />
        </div>
      </div>

      {/* 感想リンク */}
      <div className="text-center">
        <Link
          href={`/events/${id}/feedback`}
          className="text-sm"
          style={{ color: "var(--accent)" }}
        >
          感想を投稿する &rarr;
        </Link>
      </div>
    </div>
  );
}
