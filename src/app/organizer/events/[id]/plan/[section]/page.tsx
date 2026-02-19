import { redirect } from "next/navigation";

export default async function EventPlanSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  redirect(`/organizer/events/${id}/plan?tab=${section}`);
}
