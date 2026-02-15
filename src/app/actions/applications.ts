"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireVendor } from "@/lib/rbac";

export const applyToEvent = async (data: {
  eventId: string;
  message?: string;
}) => {
  const user = await requireAuth();
  requireVendor(user);

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) throw new Error("Vendor profile not found");

  // Verify event is open
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
  });
  if (!event) throw new Error("Event not found");
  if (event.status !== "OPEN") throw new Error("Event is not accepting applications");

  // Check deadline
  if (new Date() > event.deadline) throw new Error("Application deadline has passed");

  return prisma.application.create({
    data: {
      vendorId: profile.id,
      eventId: data.eventId,
      message: data.message,
    },
  });
};

export const getMyApplications = async () => {
  const user = await requireAuth();
  requireVendor(user);

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) throw new Error("Vendor profile not found");

  return prisma.application.findMany({
    where: { vendorId: profile.id },
    include: { event: { include: { organizer: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const withdrawApplication = async (applicationId: string) => {
  const user = await requireAuth();
  requireVendor(user);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { vendor: true },
  });
  if (!application) throw new Error("Application not found");

  // Vendors can only withdraw their own applications
  if (user.role !== "ADMIN" && application.vendor.userId !== user.id) {
    throw new Error("Forbidden: not your application");
  }

  if (application.status !== "PENDING") {
    throw new Error("Can only withdraw pending applications");
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { status: "WITHDRAWN" },
  });
};
