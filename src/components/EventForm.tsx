"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEvent, updateEvent } from "@/app/actions/events";

interface EventFormProps {
  event?: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    eventDate: Date;
    deadline: Date;
    maxVendors: number | null;
  };
}

export const EventForm = ({ event }: EventFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!event;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      location: (fd.get("location") as string) || undefined,
      eventDate: fd.get("eventDate") as string,
      deadline: fd.get("deadline") as string,
      maxVendors: fd.get("maxVendors") ? Number(fd.get("maxVendors")) : undefined,
    };

    try {
      if (isEdit) {
        await updateEvent(event.id, data);
      } else {
        await createEvent(data);
      }
      router.push("/organizer/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const toDateInput = (d: Date) => new Date(d).toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="イベント名" name="title" required defaultValue={event?.title} />
      <Field
        label="説明"
        name="description"
        as="textarea"
        defaultValue={event?.description ?? ""}
      />
      <Field label="開催場所" name="location" defaultValue={event?.location ?? ""} />
      <Field
        label="開催日時"
        name="eventDate"
        type="datetime-local"
        required
        defaultValue={event ? toDateInput(event.eventDate) : ""}
      />
      <Field
        label="申請締切日"
        name="deadline"
        type="datetime-local"
        required
        defaultValue={event ? toDateInput(event.deadline) : ""}
      />
      <Field
        label="最大出店数"
        name="maxVendors"
        type="number"
        defaultValue={event?.maxVendors?.toString() ?? ""}
      />

      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {loading ? "保存中..." : isEdit ? "イベントを更新" : "イベントを作成"}
      </button>
    </form>
  );
};

const Field = ({
  label,
  as,
  ...props
}: {
  label: string;
  as?: "textarea";
} & React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) => {
  const inputStyle = {
    border: "1px solid var(--border)",
    backgroundColor: "var(--card)",
  };

  return (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={props.name}
          rows={3}
          className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none"
          style={inputStyle}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={props.name}
          className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none"
          style={inputStyle}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  );
};
