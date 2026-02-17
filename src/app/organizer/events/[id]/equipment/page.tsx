import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { listCatalogItems, getEventEquipment } from "@/app/actions/equipment";
import { EquipmentSelector } from "./EquipmentSelector";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EquipmentPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const event = await getEvent(id);
  if (!event) redirect("/organizer/events");

  const [catalogItems, bookedItems] = await Promise.all([
    listCatalogItems(),
    getEventEquipment(id),
  ]);

  // Group catalog by category
  const categories = catalogItems.reduce<Record<string, typeof catalogItems>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const totalCost = bookedItems.reduce((sum, b) => sum + (b.costYen ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/organizer/events/${id}/applications`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; イベント管理に戻る
        </Link>
        <h1 className="text-2xl font-bold">{event.title} — 備品管理</h1>
      </div>

      {/* Booked items */}
      {bookedItems.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-lg font-semibold">予約済み備品</h2>
          <div className="space-y-2">
            {bookedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {item.itemName} × {item.quantity}
                </span>
                <span className="text-gray-500">
                  {item.source === "MUNICIPAL"
                    ? "無料（自治体所有）"
                    : `¥${(item.costYen ?? 0).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t pt-3 text-sm font-semibold">
            合計: ¥{totalCost.toLocaleString()}
          </div>
        </div>
      )}

      {/* Catalog */}
      <EquipmentSelector eventId={id} categories={categories} />
    </div>
  );
}
