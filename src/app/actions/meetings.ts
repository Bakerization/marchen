"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { getValidAccessToken, fetchFreeBusy } from "@/lib/google";
import { logAudit } from "@/lib/audit";

// ---- Google connection status ----
export const hasGoogleConnection = async () => {
  const user = await requireAuth();
  requireOrganizer(user);
  const token = await prisma.oAuthToken.findUnique({
    where: { provider_userId: { provider: "google", userId: user.id } },
  });
  return !!token;
};

// ---- FreeBusy ----
export const getFreeBusy = async (params: { eventId: string; timeMin: string; timeMax: string }) => {
  const user = await requireAuth();
  requireOrganizer(user);
  // access token ensures refresh
  const accessToken = await getValidAccessToken(user.id);
  const busy = await fetchFreeBusy(accessToken, params.timeMin, params.timeMax);
  await logAudit({
    userId: user.id,
    action: "GOOGLE_FREEBUSY_FETCHED",
    eventId: params.eventId,
    details: `Freebusy ${params.timeMin} - ${params.timeMax}`,
  });
  return busy;
};

// ---- Suggest slots (simple gap finder) ----
export const suggestSlots = async (params: {
  eventId: string;
  timeMin: string;
  timeMax: string;
  durationMinutes: number;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const busy = await getFreeBusy(params);

  const start = new Date(params.timeMin).getTime();
  const end = new Date(params.timeMax).getTime();
  const minGap = params.durationMinutes * 60 * 1000;

  // normalize busy blocks
  const blocks = busy
    .map((b) => [new Date(b.start).getTime(), new Date(b.end).getTime()] as const)
    .filter(([s, e]) => e > start && s < end)
    .sort((a, b) => a[0] - b[0]);

  const suggestions: { start: string; end: string }[] = [];
  let cursor = start;

  for (const [bStart, bEnd] of blocks) {
    if (bStart - cursor >= minGap) {
      suggestions.push({
        start: new Date(cursor).toISOString(),
        end: new Date(cursor + minGap).toISOString(),
      });
    }
    cursor = Math.max(cursor, bEnd);
  }

  if (end - cursor >= minGap) {
    suggestions.push({
      start: new Date(cursor).toISOString(),
      end: new Date(cursor + minGap).toISOString(),
    });
  }

  return suggestions;
};

// ---- Meeting slots CRUD ----
export const getMeetingSlots = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);
  return prisma.meetingSlot.findMany({
    where: { eventId },
    orderBy: { start: "asc" },
  });
};

export const createMeetingSlot = async (data: {
  eventId: string;
  start: string;
  end: string;
  notes?: string;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const slot = await prisma.meetingSlot.create({
    data: {
      eventId: data.eventId,
      start: new Date(data.start),
      end: new Date(data.end),
      notes: data.notes,
      organizerId: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: "MEETING_SLOT_CREATED",
    eventId: data.eventId,
    details: `${slot.start.toISOString()} - ${slot.end.toISOString()}`,
  });

  return slot;
};

// ---- Natural language ingestion ----

type ParsedSlot = { start: Date; end: Date; note: string };

const parseNaturalText = (text: string, defaultYear: number): ParsedSlot[] => {
  const slots: ParsedSlot[] = [];
  const dateRegex = /(\d{1,2})[\/](\d{1,2})/g;
  const timeBlock = (ctx: string) => {
    if (/終日/.test(ctx)) return { start: { h: 9, m: 0 }, end: { h: 17, m: 0 } };
    if (/午前/.test(ctx)) return { start: { h: 9, m: 0 }, end: { h: 12, m: 0 } };
    if (/午後/.test(ctx)) return { start: { h: 13, m: 0 }, end: { h: 17, m: 0 } };
    if (/夜/.test(ctx) || /夕方/.test(ctx)) return { start: { h: 18, m: 0 }, end: { h: 21, m: 0 } };
    return { start: { h: 13, m: 0 }, end: { h: 15, m: 0 } };
  };

  const matches = [...text.matchAll(dateRegex)];
  if (matches.length === 0) return [];

  matches.forEach((match, idx) => {
    const month = Number(match[1]);
    const day = Number(match[2]);
    const ctxEnd = idx === matches.length - 1 ? text.length : matches[idx + 1].index ?? text.length;
    const ctx = text.slice(match.index ?? 0, ctxEnd);
    const tb = timeBlock(ctx);
    const start = new Date(defaultYear, month - 1, day, tb.start.h, tb.start.m);
    const end = new Date(defaultYear, month - 1, day, tb.end.h, tb.end.m);
    const note = ctx.trim();
    slots.push({ start, end, note });
  });

  return slots;
};

export const ingestNaturalLanguage = async (data: { eventId: string; text: string }) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new Error("Event not found");

  const slots = parseNaturalText(data.text, event.eventDate.getFullYear());
  if (slots.length === 0) throw new Error("Could not find dates in text");

  const created = await prisma.$transaction(
    slots.map((s) =>
      prisma.meetingSlot.create({
        data: {
          eventId: data.eventId,
          start: s.start,
          end: s.end,
          notes: s.note,
          organizerId: user.id,
        },
      }),
    ),
  );

  await logAudit({
    userId: user.id,
    action: "MEETING_SLOTS_INGESTED",
    eventId: data.eventId,
    details: `Added ${created.length} slots from text`,
  });

  return created.length;
};

// ---- Meeting Invites ----

export const createMeetingInvite = async (data: {
  vendorTargetId: string;
  slotIds: string[];
  expiresInDays?: number;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const target = await prisma.vendorTarget.findUnique({
    where: { id: data.vendorTargetId },
    include: { event: { include: { organizer: true } } },
  });
  if (!target) throw new Error("Vendor target not found");
  if (user.role !== "ADMIN" && target.event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  // Link slots to this vendor target
  await prisma.meetingSlot.updateMany({
    where: { id: { in: data.slotIds }, eventId: target.eventId },
    data: { vendorTargetId: target.id },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 7));

  const invite = await prisma.meetingInvite.create({
    data: {
      vendorTargetId: data.vendorTargetId,
      expiresAt,
    },
  });

  await logAudit({
    userId: user.id,
    action: "MEETING_INVITE_CREATED",
    eventId: target.eventId,
    details: `Invite for ${target.vendorName}, ${data.slotIds.length} slots, token: ${invite.token}`,
  });

  return invite;
};

// ---- Public (no auth) — vendor-facing ----

export const getMeetingInviteByToken = async (token: string) => {
  const invite = await prisma.meetingInvite.findUnique({
    where: { token },
    include: {
      vendorTarget: {
        include: {
          event: { include: { organizer: true } },
          meetingSlots: {
            where: { status: "PENDING" },
            orderBy: { start: "asc" },
          },
        },
      },
    },
  });
  if (!invite) return null;
  return invite;
};

export const respondToInvite = async (token: string, selectedSlotId: string) => {
  const invite = await prisma.meetingInvite.findUnique({
    where: { token },
    include: { vendorTarget: true },
  });
  if (!invite) throw new Error("Invite not found");
  if (invite.respondedAt) throw new Error("Already responded");
  if (new Date() > invite.expiresAt) throw new Error("Invite expired");

  // Verify the slot belongs to this vendor target
  const slot = await prisma.meetingSlot.findFirst({
    where: { id: selectedSlotId, vendorTargetId: invite.vendorTargetId },
  });
  if (!slot) throw new Error("Invalid slot selection");

  // Update slot to CONFIRMED, decline others for this target
  await prisma.$transaction([
    prisma.meetingSlot.update({
      where: { id: selectedSlotId },
      data: { status: "CONFIRMED" },
    }),
    prisma.meetingSlot.updateMany({
      where: {
        vendorTargetId: invite.vendorTargetId,
        id: { not: selectedSlotId },
        status: "PENDING",
      },
      data: { status: "DECLINED" },
    }),
    prisma.meetingInvite.update({
      where: { id: invite.id },
      data: { respondedAt: new Date(), selectedSlotId },
    }),
    prisma.vendorTarget.update({
      where: { id: invite.vendorTargetId },
      data: { status: "MEETING_CONFIRMED" },
    }),
  ]);

  return { success: true };
};
