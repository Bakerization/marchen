import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEventPlanData } from "@/lib/event-plan";
import { getOrCreateThread } from "@/app/actions/chat";
import { Chat } from "@/components/Chat";

export default async function EventPlanLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const plan = await getEventPlanData(id, user);
  if (!plan) notFound();

  const thread = await getOrCreateThread(id);

  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
            <Link href="/dashboard" className="hover:underline">ダッシュボード</Link>
            <span>/</span>
            <Link href="/organizer/events" className="hover:underline">マイイベント</Link>
            <span>/</span>
            <Link href={`/organizer/events/${id}/applications`} className="hover:underline">{plan.event.title}</Link>
            <span>/</span>
            <span>計画ダッシュボード</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">計画ダッシュボード — {plan.event.title}</h1>
        </div>
        <Link
          href={`/organizer/events/${id}/plan`}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          全体を見る
        </Link>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">{children}</div>
        <aside className="xl:sticky xl:top-16 xl:self-start">
          <div
            className="overflow-hidden rounded-xl"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
              height: "calc(100vh - 5rem)",
            }}
          >
            <div className="border-b px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)" }}>
              AI Bot（計画サポート）
            </div>
            <Chat threadId={thread.id} initialMessages={thread.messages} />
          </div>
        </aside>
      </div>
    </div>
  );
}
