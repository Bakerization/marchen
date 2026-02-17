"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// ── Public (no auth) ─────────────────────────────────────────────────────

export const submitFeedback = async (
  eventId: string,
  data: { content: string; authorName?: string; rating?: number },
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  return prisma.feedback.create({
    data: {
      eventId,
      content: data.content,
      authorName: data.authorName,
      rating: data.rating,
    },
  });
};

// ── Queries ──────────────────────────────────────────────────────────────

export const getFeedbacks = async (eventId: string, publicOnly = false) => {
  return prisma.feedback.findMany({
    where: {
      eventId,
      ...(publicOnly ? { isPublic: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
};

// ── Organizer actions ────────────────────────────────────────────────────

export const toggleFeedbackPublic = async (id: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const feedback = await prisma.feedback.findUnique({
    where: { id },
    include: { event: { include: { organizer: true } } },
  });
  if (!feedback) throw new Error("Feedback not found");
  if (user.role !== "ADMIN" && feedback.event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { isPublic: !feedback.isPublic },
  });

  await logAudit({
    userId: user.id,
    action: "FEEDBACK_VISIBILITY_TOGGLED",
    eventId: feedback.eventId,
    details: `Feedback ${id} now ${updated.isPublic ? "public" : "private"}`,
  });

  return updated;
};
