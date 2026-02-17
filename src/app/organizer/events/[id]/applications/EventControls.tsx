"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { closeEvent, publishEvent } from "@/app/actions/events";

interface Props {
  eventId: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";
}

export const EventControls = ({ eventId, status }: Props) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (action: "publish" | "close") => {
    setLoading(true);
    setError(null);
    try {
      if (action === "publish") await publishEvent(eventId);
      if (action === "close") await closeEvent(eventId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {status === "DRAFT" && (
          <button
            onClick={() => handle("publish")}
            disabled={loading}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--success)" }}
          >
            公開する
          </button>
        )}
        {status === "OPEN" && (
          <button
            onClick={() => handle("close")}
            disabled={loading}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--warning)" }}
          >
            募集を締め切る
          </button>
        )}
      </div>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
};
