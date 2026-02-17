import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { calculateStaffing } from "@/lib/staffing-calculator";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StaffingPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const event = await getEvent(id);
  if (!event) redirect("/organizer/events");

  const recommendations = calculateStaffing({
    maxVendors: event.maxVendors ?? 10,
  });

  const totalHeadcount = recommendations.reduce((sum, r) => sum + r.headcount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/organizer/events/${id}/applications`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; イベント管理に戻る
        </Link>
        <h1 className="text-2xl font-bold">{event.title} — 人員計画</h1>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="mb-1 text-lg font-semibold">AI推奨人員</h2>
        <p className="mb-4 text-sm text-gray-500">
          出店者数 {event.maxVendors ?? 10} 組を基に算出
        </p>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.role}
              className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-800"
            >
              <div>
                <p className="text-sm font-medium">{rec.role}</p>
                <p className="text-xs text-gray-500">{rec.rationale}</p>
              </div>
              <span className="text-lg font-bold">{rec.headcount}名</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-3 text-right">
          <span className="text-sm text-gray-500">合計必要人数: </span>
          <span className="text-lg font-bold">{totalHeadcount}名</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/organizer/events/${id}/volunteers`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          ボランティアを招待する
        </Link>
      </div>
    </div>
  );
}
