import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { getSalesRecords } from "@/app/actions/sales";
import { prisma } from "@/lib/prisma";
import { SalesForm } from "./SalesForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SalesPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const event = await getEvent(id);
  if (!event) redirect("/organizer/events");

  const [records, acceptedApps] = await Promise.all([
    getSalesRecords(id),
    prisma.application.findMany({
      where: { eventId: id, status: "ACCEPTED" },
      include: { vendor: true },
    }),
  ]);

  const totalSales = records.reduce((sum, r) => sum + r.amountYen, 0);
  const vendorNames = acceptedApps.map((a) => ({
    name: a.vendor.shopName,
    profileId: a.vendor.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/organizer/events/${id}/applications`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; イベント管理に戻る
        </Link>
        <h1 className="text-2xl font-bold">{event.title} — 売上管理</h1>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-sm text-gray-500">総売上</p>
        <p className="text-3xl font-bold">¥{totalSales.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-1">
          {records.length} 件の売上記録
        </p>
      </div>

      {/* Sales form */}
      <SalesForm eventId={id} vendors={vendorNames} />

      {/* Records list */}
      {records.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-lg font-semibold">売上記録</h2>
          <div className="space-y-2">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm font-medium">{rec.vendorName}</p>
                  <p className="text-xs text-gray-500">
                    {rec.paymentMethod ?? "現金"} · {new Date(rec.recordedAt).toLocaleString("ja-JP")}
                  </p>
                  {rec.note && (
                    <p className="text-xs text-gray-400">{rec.note}</p>
                  )}
                </div>
                <span className="text-sm font-semibold">
                  ¥{rec.amountYen.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
