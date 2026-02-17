"use client";

import { useState } from "react";
import { applyAsVolunteer } from "@/app/actions/volunteer-public";

interface VolunteerApplyFormProps {
  eventId: string;
}

export const VolunteerApplyForm = ({ eventId }: VolunteerApplyFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await applyAsVolunteer(eventId, email.trim(), name.trim() || undefined);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        ご応募ありがとうございます。主催者から連絡をお待ちください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="メールアドレス *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          type="text"
          placeholder="お名前（任意）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isSubmitting ? "送信中..." : "ボランティアに応募する"}
      </button>
    </form>
  );
};
