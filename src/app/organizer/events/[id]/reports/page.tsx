import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { ReportTabs } from "./ReportTabs";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReportsPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const event = await getEvent(id);
  if (!event) redirect("/organizer/events");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/organizer/events/${id}/applications`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; イベント管理に戻る
        </Link>
        <h1 className="text-2xl font-bold">{event.title} — レポート</h1>
      </div>

      <ReportTabs eventId={id} />
    </div>
  );
}
