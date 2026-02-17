"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeetingSlot, ingestNaturalLanguage } from "@/app/actions/meetings";

interface Props {
  eventId: string;
}

export const MeetingManager = ({ eventId }: Props) => {
  const router = useRouter();
  const [manualError, setManualError] = useState<string | null>(null);
  const [nlpError, setNlpError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleManual = (formData: FormData) => {
    setManualError(null);
    startTransition(async () => {
      try {
        await createMeetingSlot({
          eventId,
          start: formData.get("start") as string,
          end: formData.get("end") as string,
          notes: (formData.get("notes") as string) || undefined,
        });
        setMessage("Slot added");
        router.refresh();
      } catch (err) {
        setManualError(err instanceof Error ? err.message : "Failed to add slot");
      }
    });
  };

  const handleNlp = (formData: FormData) => {
    setNlpError(null);
    startTransition(async () => {
      try {
        const text = formData.get("text") as string;
        await ingestNaturalLanguage({ eventId, text });
        setMessage("Parsed slots created");
        router.refresh();
      } catch (err) {
        setNlpError(err instanceof Error ? err.message : "Failed to parse text");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h3 className="text-base font-semibold">Add slot manually</h3>
        <form action={handleManual} className="mt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="start">Start</label>
              <input
                required
                name="start"
                id="start"
                type="datetime-local"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="end">End</label>
              <input
                required
                name="end"
                id="end"
                type="datetime-local"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="notes">Notes (vendor / place)</label>
            <input
              name="notes"
              id="notes"
              type="text"
              placeholder="例: Aパン屋 面談 Zoom"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          {manualError && <p className="text-sm text-red-600 dark:text-red-400">{manualError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Add slot
          </button>
        </form>
      </div>

      <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
        <h3 className="text-base font-semibold">Natural language ingest</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          例: "A店は3/10午後OK、B店は3/11午前。C店は3/12終日×" のように入力
        </p>
        <form action={handleNlp} className="mt-3 space-y-3">
          <textarea
            name="text"
            rows={4}
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          {nlpError && <p className="text-sm text-red-600 dark:text-red-400">{nlpError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Parse and create slots
          </button>
        </form>
      </div>

      {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
    </div>
  );
};
