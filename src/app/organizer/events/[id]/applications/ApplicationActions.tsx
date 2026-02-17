"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { reviewApplication } from "@/app/actions/events";

interface ApplicationActionsProps {
  applicationId: string;
}

export const ApplicationActions = ({ applicationId }: ApplicationActionsProps) => {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: "ACCEPTED" | "REJECTED") => {
    setLoading(true);
    setError(null);
    try {
      await reviewApplication(applicationId, decision, reason || undefined);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="理由（任意）"
        className="block w-full rounded-md px-3 py-1.5 text-sm focus:outline-none"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleDecision("ACCEPTED")}
          disabled={loading}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--success)" }}
        >
          承認
        </button>
        <button
          onClick={() => handleDecision("REJECTED")}
          disabled={loading}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--danger)" }}
        >
          却下
        </button>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
};
