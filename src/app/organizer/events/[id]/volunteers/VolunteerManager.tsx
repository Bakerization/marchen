"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteVolunteers } from "@/app/actions/volunteers";

interface VolunteerManagerProps {
  eventId: string;
}

export const VolunteerManager = ({ eventId }: VolunteerManagerProps) => {
  const router = useRouter();
  const [entries, setEntries] = useState([{ email: "", name: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = () => {
    setEntries((prev) => [...prev, { email: "", name: "" }]);
  };

  const updateEntry = (
    index: number,
    field: "email" | "name",
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const removeRow = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = entries.filter((e) => e.email.trim());
    if (valid.length === 0) return;

    setIsSubmitting(true);
    try {
      await inviteVolunteers(
        eventId,
        valid.map((v) => ({
          email: v.email.trim(),
          name: v.name.trim() || undefined,
        })),
      );
      setEntries([{ email: "", name: "" }]);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
    >
      <h2 className="mb-3 text-lg font-semibold">ボランティアを招待</h2>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="email"
              placeholder="メールアドレス"
              value={entry.email}
              onChange={(e) => updateEntry(i, "email", e.target.value)}
              required
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <input
              type="text"
              placeholder="名前（任意）"
              value={entry.name}
              onChange={(e) => updateEntry(i, "name", e.target.value)}
              className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                削除
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={addRow}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          + 行を追加
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isSubmitting ? "送信中..." : "招待メールを送信"}
        </button>
      </div>
    </form>
  );
};
