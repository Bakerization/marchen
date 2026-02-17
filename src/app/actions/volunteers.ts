"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { sendVolunteerInvite } from "@/lib/mailer";

// ── Queries ──────────────────────────────────────────────────────────────

export const getVolunteers = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  return prisma.volunteerInvite.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
  });
};

// ── Mutations ────────────────────────────────────────────────────────────

export const inviteVolunteers = async (
  eventId: string,
  volunteers: { email: string; name?: string }[],
) => {
  const user = await requireAuth();
  requireOrganizer(user);

  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new Error("Event not found");
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const results = [];

  for (const vol of volunteers) {
    // Create invite record
    const invite = await prisma.volunteerInvite.create({
      data: {
        eventId,
        email: vol.email,
        name: vol.name,
      },
    });

    // Send email (best effort)
    const emailResult = await sendVolunteerInvite({
      email: vol.email,
      name: vol.name,
      eventTitle: event.title,
      eventDate: event.eventDate.toLocaleDateString("ja-JP"),
      location: event.location,
    });

    // Log notification status
    if (emailResult.error) {
      await prisma.notification.create({
        data: {
          channel: "EMAIL",
          status: "FAILED",
          toAddress: vol.email,
          subject: `ボランティア招待: ${event.title}`,
          body: "Volunteer invite email",
          eventId,
          error: emailResult.error,
        },
      });
    }

    results.push(invite);
  }

  await logAudit({
    userId: user.id,
    action: "VOLUNTEERS_INVITED",
    eventId,
    details: `Invited ${volunteers.length} volunteers`,
  });

  return results;
};

export const updateVolunteerStatus = async (
  id: string,
  status: "INVITED" | "CONFIRMED" | "DECLINED" | "CANCELLED",
) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const invite = await prisma.volunteerInvite.findUnique({
    where: { id },
    include: { event: { include: { organizer: true } } },
  });
  if (!invite) throw new Error("Volunteer invite not found");
  if (user.role !== "ADMIN" && invite.event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const updated = await prisma.volunteerInvite.update({
    where: { id },
    data: { status },
  });

  await logAudit({
    userId: user.id,
    action: "VOLUNTEER_STATUS_UPDATED",
    eventId: invite.eventId,
    details: `${invite.name ?? invite.email}: ${status}`,
  });

  return updated;
};
