import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { EventForm } from "@/components/EventForm";
import { AppSidebarShell } from "@/components/AppSidebarShell";

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppSidebarShell user={user}>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">新規イベント作成</h1>
        <EventForm />
      </div>
    </AppSidebarShell>
  );
}
