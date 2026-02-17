"use client";

import { useTransition, useState } from "react";
import { suggestSlots } from "@/app/actions/meetings";

interface Props {
  eventId: string;
}

const formatter = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const FreeBusyPanel = ({ eventId }: Props) => {
  const [busyError, setBusyError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ start: string; end: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  const handle = (formData: FormData) => {
    setBusyError(null);
    setSuggestions([]);
    startTransition(async () => {
      try {
        const timeMin = formData.get("timeMin") as string;
        const timeMax = formData.get("timeMax") as string;
        const durationMinutes = Number(formData.get("durationMinutes")) || 30;
        const result = await suggestSlots({ eventId, timeMin, timeMax, durationMinutes });
        setSuggestions(result);
      } catch (err) {
        setBusyError(err instanceof Error ? err.message : "Failed to fetch availability");
      }
    });
  };

  return (
    <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Check availability</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Google Free/Busyから空き枠候補を提案します。</p>
        </div>
      </div>

      <form action={handle} className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="timeMin">From</label>
          <input
            required
            type="datetime-local"
            name="timeMin"
            id="timeMin"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="timeMax">To</label>
          <input
            required
            type="datetime-local"
            name="timeMax"
            id="timeMax"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="durationMinutes">Duration (min)</label>
          <input
            type="number"
            name="durationMinutes"
            id="durationMinutes"
            defaultValue={30}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isPending ? "Checking..." : "Check"}
          </button>
        </div>
      </form>

      {busyError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{busyError}</p>}

      {suggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Suggested slots</p>
          <ul className="space-y-1 text-sm">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900/50">
                <span>
                  {formatter.format(new Date(s.start))} - {formatter.format(new Date(s.end))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
