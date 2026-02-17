import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { getVolunteers } from "@/app/actions/volunteers";
import { VolunteerManager } from "./VolunteerManager";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  INVITED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default async function VolunteersPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const event = await getEvent(id);
  if (!event) redirect("/organizer/events");

  const volunteers = await getVolunteers(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/organizer/events/${id}/staffing`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; 人員計画に戻る
        </Link>
        <h1 className="text-2xl font-bold">{event.title} — ボランティア管理</h1>
      </div>

      <VolunteerManager eventId={id} />

      {volunteers.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-lg font-semibold">
            招待済みボランティア ({volunteers.length}名)
          </h2>
          <div className="space-y-2">
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm font-medium">
                    {vol.name ?? "名前未設定"}
                  </p>
                  <p className="text-xs text-gray-500">{vol.email}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[vol.status] ?? ""}`}
                >
                  {vol.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
