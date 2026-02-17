"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyToEvent } from "@/app/actions/applications";

interface Props {
  eventId: string;
  deadlineIso: string;
  isOpen: boolean;
}

export const ApplyForm = ({ eventId, deadlineIso, isOpen }: Props) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deadlinePassed = new Date() > new Date(deadlineIso);
  const disabled = !isOpen || deadlinePassed || loading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await applyToEvent({ eventId, message: message || undefined });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium" htmlFor="message">
          メッセージ（任意）
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        />
      </div>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {deadlinePassed ? "締切を過ぎています" : loading ? "申請中..." : "出店申請する"}
      </button>
    </form>
  );
};
