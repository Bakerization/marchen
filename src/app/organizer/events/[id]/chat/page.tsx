import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { getOrCreateThread } from "@/app/actions/chat";
import { getEvent } from "@/app/actions/events";
import { Chat } from "@/components/Chat";
import { ChatSidebar } from "@/components/ChatSidebar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const event = await getEvent(id);
  if (!event) redirect("/organizer/events");

  const thread = await getOrCreateThread(id);

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 min-h-[calc(100vh-3.5rem)]">
      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="p-6">
          <div className="mb-4">
            <Link
              href={`/organizer/events/${id}/applications`}
              className="text-sm underline"
              style={{ color: "var(--muted)" }}
            >
              ← イベント管理に戻る
            </Link>
            <h1 className="mt-1 text-2xl font-bold">{event.title} — AIアシスタント</h1>
          </div>

          <div className="rounded-xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
            <h2 className="text-lg font-semibold">ワークフロー</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              右側チャットを使って、企画・募集・運営・報告まで一貫して進められます。
            </p>
            <div className="mt-4 rounded-lg" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
              <ChatSidebar currentStep="plan" />
            </div>
          </div>
        </section>

        <aside
          className="xl:sticky xl:top-0 xl:self-start"
          style={{
            borderLeft: "1px solid var(--border)",
            backgroundColor: "var(--card)",
            height: "calc(100vh - 3.5rem)",
          }}
        >
          <div className="border-b px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)" }}>
            Chat
          </div>
          <div style={{ height: "calc(100vh - 7.5rem)" }}>
            <Chat threadId={thread.id} initialMessages={thread.messages} />
          </div>
        </aside>
      </div>
    </div>
  );
}
