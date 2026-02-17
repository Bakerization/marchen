"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const getSalesRecords = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  return prisma.salesRecord.findMany({
    where: { eventId },
    orderBy: { recordedAt: "asc" },
  });
};

export const createSalesRecord = async (data: {
  eventId: string;
  vendorName: string;
  vendorProfileId?: string;
  amountYen: number;
  paymentMethod?: string;
  note?: string;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
    include: { organizer: true },
  });
  if (!event) throw new Error("Event not found");
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const record = await prisma.salesRecord.create({
    data: {
      eventId: data.eventId,
      vendorName: data.vendorName,
      vendorProfileId: data.vendorProfileId,
      amountYen: data.amountYen,
      paymentMethod: data.paymentMethod,
      note: data.note,
    },
  });

  await logAudit({
    userId: user.id,
    action: "SALES_RECORDED",
    eventId: data.eventId,
    details: `${data.vendorName}: ¥${data.amountYen} (${data.paymentMethod ?? "cash"})`,
  });

  return record;
};
