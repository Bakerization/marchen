import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEvent } from "@/app/actions/events";
import { EventForm } from "@/components/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">イベントを編集</h1>
      <EventForm event={event} />
    </div>
  );
}
