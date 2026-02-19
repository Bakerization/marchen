import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "desc" } } },
  });

  if (!vendor) return { title: "パン屋が見つかりません" };

  return {
    title: `${vendor.shopName} | Marchen`,
    description: vendor.description ?? `${vendor.shopName} の紹介ページ`,
    openGraph: {
      title: vendor.shopName,
      description: vendor.description ?? undefined,
      images: vendor.photos[0]?.imageUrl ? [{ url: vendor.photos[0].imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: vendor.shopName,
      description: vendor.description ?? undefined,
      images: vendor.photos[0]?.imageUrl ? [vendor.photos[0].imageUrl] : undefined,
    },
  };
}

export default async function BakeryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      photos: { orderBy: [{ type: "asc" }, { createdAt: "desc" }] },
      applications: {
        where: { status: "ACCEPTED" },
        include: { event: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });

  if (!vendor) notFound();

  const heroPhoto = vendor.photos[0];
  const restPhotos = vendor.photos.slice(1);

  return (
    <div>
      {/* Full-screen hero photo */}
      {heroPhoto && (
        <div className="relative -mx-4 h-[70vh] w-[calc(100%+2rem)]">
          <Image
            src={heroPhoto.imageUrl}
            alt={heroPhoto.caption ?? vendor.shopName}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-4xl font-bold tracking-tight drop-shadow">{vendor.shopName}</h1>
            {vendor.category && (
              <p className="mt-1 text-sm text-white/80">{vendor.category}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6 py-8">
        {/* If no hero photo, show title here */}
        {!heroPhoto && (
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{vendor.shopName}</h1>
            {vendor.category && <p className="text-sm" style={{ color: "var(--muted)" }}>{vendor.category}</p>}
          </div>
        )}

        {vendor.description && (
          <p className="text-base whitespace-pre-line">{vendor.description}</p>
        )}

        {/* Remaining photos in a borderless grid */}
        {restPhotos.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">ギャラリー</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {restPhotos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-lg">
                  <div className="relative h-56 w-full">
                    <Image
                      src={photo.imageUrl}
                      alt={photo.caption ?? vendor.shopName}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  {photo.caption && (
                    <figcaption className="pt-1 text-xs" style={{ color: "var(--muted)" }}>
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>

      {vendor.applications.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">出店中・出店予定のマルシェ</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {vendor.applications.map((app) => (
              <Link
                key={app.id}
                href={`/events/${app.eventId}`}
                className="rounded-lg p-3 hover:opacity-90"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
              >
                <p className="font-medium">{app.event.title}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {new Date(app.event.eventDate).toLocaleDateString("ja-JP")} · {app.event.location ?? "未定"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

