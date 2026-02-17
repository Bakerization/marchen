import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { getMeetingSlots, hasGoogleConnection } from "@/app/actions/meetings";
import { MeetingManager } from "./MeetingManager";
import { FreeBusyPanel } from "./FreeBusyPanel";

const SLOT_FMT = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const [event, slots, googleConnected] = await Promise.all([
    getEvent(id),
    getMeetingSlots(id),
    hasGoogleConnection(),
  ]);

  if (!event) notFound();

  return (
    <div className="space-y-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meetings · {event.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            面談スロットを作成し、Googleカレンダーの空き枠と合わせて調整します。
          </p>
        </div>
        <Link
          href={`/organizer/events/${event.id}/applications`}
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
        >
          ← Applications
        </Link>
      </div>

      <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Google Calendar</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              連携するとFree/Busy取得とカレンダー登録が可能になります。
            </p>
          </div>
          {googleConnected ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Connected
            </span>
          ) : (
            <Link
              href="/api/google/start"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Connect Google Calendar
            </Link>
          )}
        </div>
      </div>

      <MeetingManager eventId={event.id} />

      <FreeBusyPanel eventId={event.id} />

      <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Existing slots</h2>
        {slots.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No slots yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {slots.map((slot) => (
              <li key={slot.id} className="flex items-start justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900/50">
                <div>
                  <p className="font-medium">
                    {SLOT_FMT.format(slot.start)} - {SLOT_FMT.format(slot.end)}
                  </p>
                  {slot.notes && <p className="text-gray-600 dark:text-gray-400">{slot.notes}</p>}
                </div>
                <span className="text-xs text-gray-500">{slot.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
