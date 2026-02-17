import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { EventForm } from "@/components/EventForm";

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">新規イベント作成</h1>
      <EventForm />
    </div>
  );
}
