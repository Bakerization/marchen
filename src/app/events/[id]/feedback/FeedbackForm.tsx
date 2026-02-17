"use client";

import { useState } from "react";
import { submitFeedback } from "@/app/actions/feedback";

interface FeedbackFormProps {
  eventId: string;
}

export const FeedbackForm = ({ eventId }: FeedbackFormProps) => {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback(eventId, {
        content: content.trim(),
        authorName: authorName.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
      });
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="text-green-800 dark:text-green-200 font-medium">
          ご感想ありがとうございました!
        </p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          主催者の承認後に公開されます。
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 space-y-3"
    >
      <div>
        <label className="block text-sm font-medium mb-1">お名前（任意）</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="匿名で投稿されます"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">評価</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star === rating ? 0 : star)}
              className={`text-2xl ${
                star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">感想 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="イベントの感想をお聞かせください..."
          required
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isSubmitting ? "送信中..." : "感想を送信"}
      </button>
    </form>
  );
};
