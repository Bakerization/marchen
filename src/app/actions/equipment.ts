"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// ── Queries ──────────────────────────────────────────────────────────────

export const listCatalogItems = async (source?: string) => {
  return prisma.equipmentCatalog.findMany({
    where: {
      isActive: true,
      ...(source ? { source: source as "MUNICIPAL" | "PARTNER_VENDOR" | "PURCHASE" } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
};

export const getEventEquipment = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  return prisma.equipmentBooking.findMany({
    where: { eventId },
    include: { catalogItem: true },
    orderBy: { createdAt: "asc" },
  });
};

// ── Mutations ────────────────────────────────────────────────────────────

export const createCatalogItem = async (data: {
  name: string;
  category: string;
  source: "MUNICIPAL" | "PARTNER_VENDOR" | "PURCHASE";
  priceYen: number;
  vendorName?: string;
  description?: string;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const item = await prisma.equipmentCatalog.create({ data });

  await logAudit({
    userId: user.id,
    action: "CATALOG_ITEM_CREATED",
    details: `Created catalog item: ${data.name} (${data.source}, ¥${data.priceYen})`,
  });

  return item;
};

export const updateCatalogItem = async (
  id: string,
  data: {
    name?: string;
    category?: string;
    priceYen?: number;
    vendorName?: string;
    description?: string;
    isActive?: boolean;
  },
) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const item = await prisma.equipmentCatalog.update({ where: { id }, data });

  await logAudit({
    userId: user.id,
    action: "CATALOG_ITEM_UPDATED",
    details: `Updated catalog item: ${item.name}`,
  });

  return item;
};

export const bookEquipment = async (
  eventId: string,
  items: { catalogItemId: string; quantity: number }[],
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

  // Fetch catalog items
  const catalogItems = await prisma.equipmentCatalog.findMany({
    where: { id: { in: items.map((i) => i.catalogItemId) } },
  });

  const bookings = await prisma.$transaction(
    items.map((item) => {
      const catalog = catalogItems.find((c) => c.id === item.catalogItemId);
      if (!catalog) throw new Error(`Catalog item not found: ${item.catalogItemId}`);

      return prisma.equipmentBooking.create({
        data: {
          eventId,
          catalogItemId: catalog.id,
          itemName: catalog.name,
          quantity: item.quantity,
          source: catalog.source,
          costYen: catalog.priceYen * item.quantity,
          vendorName: catalog.vendorName,
          neededDate: event.eventDate,
        },
      });
    }),
  );

  await logAudit({
    userId: user.id,
    action: "EQUIPMENT_BOOKED",
    eventId,
    details: `Booked ${bookings.length} items for ${event.title}`,
  });

  return bookings;
};
