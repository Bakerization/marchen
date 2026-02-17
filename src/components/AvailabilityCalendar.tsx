"use client";

import { useState } from "react";

interface Slot {
  id: string;
  start: Date | string;
  end: Date | string;
  notes?: string | null;
}

interface AvailabilityCalendarProps {
  slots: Slot[];
  selectedSlotId?: string | null;
  onSelect?: (slotId: string) => void;
  readOnly?: boolean;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

const formatDate = (date: Date) =>
  date.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

export const AvailabilityCalendar = ({
  slots,
  selectedSlotId,
  onSelect,
  readOnly = false,
}: AvailabilityCalendarProps) => {
  const [selected, setSelected] = useState<string | null>(selectedSlotId ?? null);

  // Group slots by date
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const date = new Date(slot.start);
    const key = date.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const handleSelect = (slotId: string) => {
    if (readOnly) return;
    setSelected(slotId);
    onSelect?.(slotId);
  };

  return (
    <div className="space-y-4">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatDate(new Date(dateKey + "T00:00:00"))}
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {grouped[dateKey].map((slot) => {
              const start = new Date(slot.start);
              const end = new Date(slot.end);
              const isSelected = selected === slot.id;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleSelect(slot.id)}
                  disabled={readOnly}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    isSelected
                      ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                      : "border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500"
                  } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                >
                  <p className="font-medium">
                    {formatTime(start)} 〜 {formatTime(end)}
                  </p>
                  {slot.notes && (
                    <p
                      className={`mt-1 text-xs ${
                        isSelected
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {slot.notes}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {sortedDates.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          候補日がありません
        </p>
      )}
    </div>
  );
};
