"use client";

import { useState } from "react";
import { respondToInvite } from "@/app/actions/meetings";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";

interface Slot {
  id: string;
  start: Date;
  end: Date;
  notes: string | null;
}

interface InviteResponseProps {
  token: string;
  slots: Slot[];
}

export const InviteResponse = ({ token, slots }: InviteResponseProps) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedSlotId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await respondToInvite(token, selectedSlotId);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="text-lg font-semibold text-green-800 dark:text-green-200">
          面談日時を確定しました
        </p>
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
          ご回答ありがとうございました。主催者から詳細のご連絡をお待ちください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AvailabilityCalendar
        slots={slots}
        selectedSlotId={selectedSlotId}
        onSelect={setSelectedSlotId}
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedSlotId || isSubmitting}
        className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isSubmitting ? "送信中..." : "この日時で確定する"}
      </button>
    </div>
  );
};
