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
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div>
          <Link
            href={`/organizer/events/${id}/applications`}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &larr; イベント管理に戻る
          </Link>
          <h1 className="text-lg font-bold">{event.title} — AIアシスタント</h1>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar currentStep="plan" />
        <div className="flex-1">
          <Chat threadId={thread.id} initialMessages={thread.messages} />
        </div>
      </div>
    </div>
  );
}
