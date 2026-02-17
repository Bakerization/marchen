"use server";

import { prisma } from "@/lib/prisma";

/**
 * Public action — no auth required.
 * Allows anyone to volunteer for an event by providing an email.
 */
export const applyAsVolunteer = async (
  eventId: string,
  email: string,
  name?: string,
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  // Simple duplicate check
  const existing = await prisma.volunteerInvite.findFirst({
    where: { eventId, email },
  });
  if (existing) throw new Error("既に応募済みです");

  return prisma.volunteerInvite.create({
    data: {
      eventId,
      email,
      name,
      status: "CONFIRMED",
    },
  });
};
