import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEvent, getEventApplications } from "@/app/actions/events";
import { ApplicationActions } from "./ApplicationActions";
import { EventControls } from "./EventControls";

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "審査中", bg: "var(--accent-light)", text: "var(--muted)" },
  ACCEPTED: { label: "承認", bg: "var(--success-light)", text: "var(--success)" },
  REJECTED: { label: "却下", bg: "var(--danger-light)", text: "var(--danger)" },
  WITHDRAWN: { label: "取下げ", bg: "var(--warning-light)", text: "var(--warning)" },
};

export default async function EventApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const applications = await getEventApplications(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {new Date(event.eventDate).toLocaleDateString("ja-JP")} &middot;{" "}
          {event.status} &middot; {applications.length}件の申請
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <EventControls eventId={event.id} status={event.status} />
        <div className="flex gap-3 text-sm">
          <Link href={`/organizer/events/${event.id}/meetings`} style={{ color: "var(--accent)" }}>面談管理</Link>
          <Link href={`/organizer/events/${event.id}/chat`} style={{ color: "var(--accent)" }}>AIチャット</Link>
          <Link href={`/organizer/events/${event.id}/equipment`} style={{ color: "var(--accent)" }}>備品</Link>
          <Link href={`/organizer/events/${event.id}/staffing`} style={{ color: "var(--accent)" }}>人員</Link>
          <Link href={`/organizer/events/${event.id}/sales`} style={{ color: "var(--accent)" }}>売上</Link>
          <Link href={`/organizer/events/${event.id}/spec`} style={{ color: "var(--accent)" }}>仕様書</Link>
          <Link href={`/organizer/events/${event.id}/reports`} style={{ color: "var(--accent)" }}>レポート</Link>
          <Link href="/dashboard/media" style={{ color: "var(--accent)" }}>写真設定</Link>
          <Link href={`/organizer/events/${event.id}/next-steps`} style={{ color: "var(--accent)" }}>次やること</Link>
          <Link href={`/organizer/events/${event.id}/plan`} style={{ color: "var(--accent)" }}>計画ダッシュボード</Link>
        </div>
      </div>

      <h2 className="text-lg font-semibold">出店申請一覧</h2>

      {applications.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>まだ申請がありません。</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const status = STATUS_LABEL[app.status];
            return (
              <div
                key={app.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{app.vendor.shopName}</p>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {app.vendor.user.name ?? app.vendor.user.email}
                      {app.vendor.category && ` · ${app.vendor.category}`}
                    </p>
                    {app.message && (
                      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                        {app.message}
                      </p>
                    )}
                  </div>
                  {status && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  )}
                </div>

                {app.status === "PENDING" && (
                  <ApplicationActions applicationId={app.id} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
