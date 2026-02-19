import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getEventPlanData } from "@/lib/event-plan";
import { PlanDashboardClient } from "@/components/PlanDashboardClient";

export default async function EventPlanDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const tab = (await searchParams).tab;
  const plan = await getEventPlanData(id, user);
  if (!plan) notFound();

  return (
    <PlanDashboardClient
      eventId={id}
      initialTab={tab}
      sections={plan.sections}
      completedSections={plan.completedSections}
      totalSections={plan.totalSections}
      completedTasks={plan.completedTasks}
      totalTasks={plan.totalTasks}
    />
  );
}
