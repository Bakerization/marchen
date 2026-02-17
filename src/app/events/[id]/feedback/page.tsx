import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/app/actions/events";
import { getFeedbacks } from "@/app/actions/feedback";
import { FeedbackForm } from "./FeedbackForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeedbackPage({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const publicFeedbacks = await getFeedbacks(id, true);

  return (
    <div className="mx-auto max-w-lg py-8 px-4 space-y-6">
      <div>
        <Link
          href={`/events/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          &larr; イベントに戻る
        </Link>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-sm text-gray-500">感想をお聞かせください</p>
      </div>

      <FeedbackForm eventId={id} />

      {publicFeedbacks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">みんなの感想</h2>
          {publicFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {fb.authorName ?? "匿名"}
                </span>
                {fb.rating && (
                  <span className="text-sm text-yellow-500">
                    {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {fb.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
