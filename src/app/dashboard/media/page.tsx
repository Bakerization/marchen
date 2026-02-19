import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import {
  EVENT_PHOTO_LABEL,
  EVENT_PHOTO_TYPE_OPTIONS,
  VENDOR_PHOTO_LABEL,
  VENDOR_PHOTO_TYPE_OPTIONS,
} from "@/lib/media-types";
import {
  deleteEventPhoto,
  deleteVendorPhoto,
  uploadEventPhoto,
  uploadVendorPhoto,
} from "@/app/actions/media";
import { FilePickerButton } from "@/components/FilePickerButton";

export const dynamic = "force-dynamic";

export default async function MediaSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const events =
    user.role === "ORGANIZER"
      ? await prisma.event.findMany({
          where: { organizer: { userId: user.id } },
          include: { photos: { orderBy: { createdAt: "desc" } } },
          orderBy: { eventDate: "asc" },
        })
      : user.role === "ADMIN"
        ? await prisma.event.findMany({
            include: { photos: { orderBy: { createdAt: "desc" } } },
            orderBy: { eventDate: "asc" },
            take: 20,
          })
        : [];

  const vendorProfile = (user.role === "VENDOR" || user.role === "ADMIN")
    ? await prisma.vendorProfile.findUnique({
        where: { userId: user.id },
        include: { photos: { orderBy: { createdAt: "desc" } } },
      })
    : null;

  return (
    <AppSidebarShell user={user}>
      <div className="space-y-8 py-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">写真設定</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          イベントページとパン屋ページの写真を追加・差し替えできます。画像はVercel Blobに保存されます。
        </p>
      </div>

      {(user.role === "ORGANIZER" || user.role === "ADMIN") && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">マルシェ写真</h2>
          {events.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>管理できるイベントがありません。</p>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl p-4"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        {new Date(event.eventDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <Link href={`/events/${event.id}`} className="text-sm" style={{ color: "var(--accent)" }}>
                      公開ページを見る
                    </Link>
                  </div>

                  <form action={uploadEventPhoto} className="grid gap-3 md:grid-cols-5">
                    <input type="hidden" name="eventId" value={event.id} />
                    <select
                      name="type"
                      className="rounded-md px-3 py-2 text-sm"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                      defaultValue="GALLERY"
                    >
                      {EVENT_PHOTO_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {EVENT_PHOTO_LABEL[type]}
                        </option>
                      ))}
                    </select>
                    <input
                      name="caption"
                      placeholder="キャプション（任意）"
                      className="rounded-md px-3 py-2 text-sm md:col-span-2"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                    />
                    <FilePickerButton name="image" accept="image/*" required />
                    <button
                      type="submit"
                      className="rounded-md px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      追加
                    </button>
                  </form>

                  {event.photos.length === 0 ? (
                    <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>写真はまだありません。</p>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {event.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-lg"
                          style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                        >
                          <div className="relative h-40 w-full">
                            <Image src={photo.imageUrl} alt={photo.caption ?? event.title} fill className="object-cover" />
                          </div>
                          <div className="space-y-2 p-3 text-sm">
                            <p className="font-medium">{EVENT_PHOTO_LABEL[photo.type]}</p>
                            {photo.caption && <p style={{ color: "var(--muted)" }}>{photo.caption}</p>}
                            <form action={deleteEventPhoto}>
                              <input type="hidden" name="photoId" value={photo.id} />
                              <button type="submit" className="text-sm" style={{ color: "var(--danger)" }}>
                                削除
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(user.role === "VENDOR" || user.role === "ADMIN") && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">パン屋写真</h2>
          {!vendorProfile ? (
            <p style={{ color: "var(--muted)" }}>出店者プロフィールが見つかりません。</p>
          ) : (
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">{vendorProfile.shopName}</p>
                <Link href={`/bakeries/${vendorProfile.id}`} className="text-sm" style={{ color: "var(--accent)" }}>
                  パン屋ページを見る
                </Link>
              </div>

              <form action={uploadVendorPhoto} className="grid gap-3 md:grid-cols-5">
                <input type="hidden" name="vendorId" value={vendorProfile.id} />
                <select
                  name="type"
                  className="rounded-md px-3 py-2 text-sm"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                  defaultValue="PRODUCT"
                >
                  {VENDOR_PHOTO_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {VENDOR_PHOTO_LABEL[type]}
                    </option>
                  ))}
                </select>
                <input
                  name="caption"
                  placeholder="キャプション（任意）"
                  className="rounded-md px-3 py-2 text-sm md:col-span-2"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                />
                <FilePickerButton name="image" accept="image/*" required />
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  追加
                </button>
              </form>

              {vendorProfile.photos.length === 0 ? (
                <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>写真はまだありません。</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {vendorProfile.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-lg"
                      style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                    >
                      <div className="relative h-40 w-full">
                        <Image src={photo.imageUrl} alt={photo.caption ?? vendorProfile.shopName} fill className="object-cover" />
                      </div>
                      <div className="space-y-2 p-3 text-sm">
                        <p className="font-medium">{VENDOR_PHOTO_LABEL[photo.type]}</p>
                        {photo.caption && <p style={{ color: "var(--muted)" }}>{photo.caption}</p>}
                        <form action={deleteVendorPhoto}>
                          <input type="hidden" name="photoId" value={photo.id} />
                          <button type="submit" className="text-sm" style={{ color: "var(--danger)" }}>
                            削除
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      </div>
    </AppSidebarShell>
  );
}
