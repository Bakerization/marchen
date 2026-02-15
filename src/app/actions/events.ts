"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const getEvents = async () => {
  return prisma.event.findMany({
    include: { organizer: true, _count: { select: { applications: true } } },
    orderBy: { eventDate: "asc" },
  });
};

export const getMyEvents = async () => {
  const user = await requireAuth();
  requireOrganizer(user);

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) throw new Error("Organizer profile not found");

  return prisma.event.findMany({
    where: { organizerId: profile.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { eventDate: "asc" },
  });
};

export const createEvent = async (data: {
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  deadline: string;
  maxVendors?: number;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) throw new Error("Organizer profile not found");

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      eventDate: new Date(data.eventDate),
      deadline: new Date(data.deadline),
      maxVendors: data.maxVendors,
      organizerId: profile.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: "EVENT_CREATED",
    eventId: event.id,
    details: `Created event: ${event.title}`,
  });

  return event;
};

export const publishEvent = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new Error("Event not found");

  // Organizers can only manage their own events (admin can manage all)
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "OPEN" },
  });

  await logAudit({
    userId: user.id,
    action: "EVENT_PUBLISHED",
    eventId: event.id,
    details: `Published event: ${event.title}`,
  });

  return updated;
};

export const reviewApplication = async (
  applicationId: string,
  decision: "ACCEPTED" | "REJECTED",
) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { event: { include: { organizer: true } } },
  });
  if (!application) throw new Error("Application not found");

  // Organizers can only review applications to their own events
  if (
    user.role !== "ADMIN" &&
    application.event.organizer.userId !== user.id
  ) {
    throw new Error("Forbidden: not your event");
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { status: decision },
  });

  await logAudit({
    userId: user.id,
    action: `APPLICATION_${decision}`,
    eventId: application.eventId,
    applicationId: application.id,
    details: `${decision} application ${application.id}`,
  });

  return updated;
};
