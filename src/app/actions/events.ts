"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// ── Helpers ──────────────────────────────────────────────────────────────

const getOrgProfile = async (userId: string) => {
  const profile = await prisma.organizerProfile.findUnique({
    where: { userId },
  });
  if (!profile) throw new Error("Organizer profile not found");
  return profile;
};

const assertEventOwner = async (eventId: string, userId: string, role: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new Error("Event not found");
  if (role !== "ADMIN" && event.organizer.userId !== userId) {
    throw new Error("Forbidden: not your event");
  }
  return event;
};

// ── Queries ──────────────────────────────────────────────────────────────

export const getEvents = async () => {
  return prisma.event.findMany({
    where: { status: { in: ["OPEN", "CLOSED", "COMPLETED"] } },
    include: { organizer: true, _count: { select: { applications: true } } },
    orderBy: { eventDate: "asc" },
  });
};

export const getMyEvents = async () => {
  const user = await requireAuth();
  requireOrganizer(user);
  const profile = await getOrgProfile(user.id);

  return prisma.event.findMany({
    where: { organizerId: profile.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { eventDate: "asc" },
  });
};

export const getEvent = async (eventId: string) => {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
};

export const getEventApplications = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);
  await assertEventOwner(eventId, user.id, user.role);

  return prisma.application.findMany({
    where: { eventId },
    include: { vendor: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });
};

// ── Mutations ────────────────────────────────────────────────────────────

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
  const profile = await getOrgProfile(user.id);

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

export const updateEvent = async (
  eventId: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    eventDate?: string;
    deadline?: string;
    maxVendors?: number | null;
  },
) => {
  const user = await requireAuth();
  requireOrganizer(user);
  const event = await assertEventOwner(eventId, user.id, user.role);

  if (event.status !== "DRAFT") {
    throw new Error("Can only edit events in DRAFT status");
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.eventDate !== undefined && { eventDate: new Date(data.eventDate) }),
      ...(data.deadline !== undefined && { deadline: new Date(data.deadline) }),
      ...(data.maxVendors !== undefined && { maxVendors: data.maxVendors }),
    },
  });

  await logAudit({
    userId: user.id,
    action: "EVENT_UPDATED",
    eventId: event.id,
    details: `Updated event: ${updated.title}`,
  });

  return updated;
};

export const publishEvent = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);
  const event = await assertEventOwner(eventId, user.id, user.role);

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

export const closeEvent = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);
  const event = await assertEventOwner(eventId, user.id, user.role);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "CLOSED" },
  });

  await logAudit({
    userId: user.id,
    action: "EVENT_CLOSED",
    eventId: event.id,
    details: `Closed event: ${event.title}`,
  });

  return updated;
};

export const reviewApplication = async (
  applicationId: string,
  decision: "ACCEPTED" | "REJECTED",
  reason?: string,
) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      event: { include: { organizer: true } },
      vendor: { include: { user: true } },
    },
  });
  if (!application) throw new Error("Application not found");

  if (user.role !== "ADMIN" && application.event.organizer.userId !== user.id) {
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
    details: reason
      ? `${decision} ${application.vendor.shopName}: ${reason}`
      : `${decision} ${application.vendor.shopName}`,
  });

  return updated;
};

// ── CSV Export ────────────────────────────────────────────────────────────

export const exportEventCSV = async (eventId: string): Promise<string> => {
  const user = await requireAuth();
  requireOrganizer(user);
  await assertEventOwner(eventId, user.id, user.role);

  const applications = await prisma.application.findMany({
    where: { eventId },
    include: {
      vendor: { include: { user: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  const event = await prisma.event.findUnique({ where: { id: eventId } });

  const header = "Shop Name,Contact Name,Email,Category,Status,Applied At,Decision Reason";
  const rows = applications.map((app) => {
    const reason = app.auditLogs[0]?.details ?? "";
    return [
      csvEscape(app.vendor.shopName),
      csvEscape(app.vendor.user.name ?? ""),
      csvEscape(app.vendor.user.email),
      csvEscape(app.vendor.category ?? ""),
      app.status,
      app.createdAt.toISOString(),
      csvEscape(reason),
    ].join(",");
  });

  await logAudit({
    userId: user.id,
    action: "CSV_EXPORTED",
    eventId,
    details: `Exported CSV for ${event?.title ?? eventId}: ${applications.length} rows`,
  });

  return [header, ...rows].join("\n");
};

const csvEscape = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};
