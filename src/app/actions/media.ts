"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer, requireVendor } from "@/lib/rbac";
import { uploadImageToBlob } from "@/lib/blob";
import { EVENT_PHOTO_TYPE_OPTIONS, VENDOR_PHOTO_TYPE_OPTIONS } from "@/lib/media-types";

const parseEventPhotoType = (value: FormDataEntryValue | null) => {
  const type = typeof value === "string" ? value : "";
  if (!EVENT_PHOTO_TYPE_OPTIONS.includes(type as (typeof EVENT_PHOTO_TYPE_OPTIONS)[number])) {
    throw new Error("Invalid event photo type");
  }
  return type as (typeof EVENT_PHOTO_TYPE_OPTIONS)[number];
};

const parseVendorPhotoType = (value: FormDataEntryValue | null) => {
  const type = typeof value === "string" ? value : "";
  if (!VENDOR_PHOTO_TYPE_OPTIONS.includes(type as (typeof VENDOR_PHOTO_TYPE_OPTIONS)[number])) {
    throw new Error("Invalid vendor photo type");
  }
  return type as (typeof VENDOR_PHOTO_TYPE_OPTIONS)[number];
};

const assertEventOwnership = async (eventId: string, userId: string, role: string) => {
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

const assertVendorOwnership = async (vendorId: string, userId: string, role: string) => {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
  });
  if (!vendor) throw new Error("Vendor not found");
  if (role !== "ADMIN" && vendor.userId !== userId) {
    throw new Error("Forbidden: not your bakery profile");
  }
  return vendor;
};

export const uploadEventPhoto = async (formData: FormData) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) throw new Error("eventId is required");
  await assertEventOwnership(eventId, user.id, user.role);

  const type = parseEventPhotoType(formData.get("type"));
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("image");
  if (!(file instanceof File)) throw new Error("Image file is required");

  const uploaded = await uploadImageToBlob({ file, prefix: `events/${eventId}` });

  await prisma.eventPhoto.create({
    data: {
      eventId,
      type,
      caption,
      imageUrl: uploaded.url,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
    },
  });

  revalidatePath("/dashboard/media");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
};

export const deleteEventPhoto = async (formData: FormData) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const photoId = String(formData.get("photoId") ?? "");
  if (!photoId) throw new Error("photoId is required");

  const photo = await prisma.eventPhoto.findUnique({
    where: { id: photoId },
    include: { event: { include: { organizer: true } } },
  });
  if (!photo) throw new Error("Event photo not found");
  if (user.role !== "ADMIN" && photo.event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  await prisma.eventPhoto.delete({ where: { id: photoId } });

  revalidatePath("/dashboard/media");
  revalidatePath("/events");
  revalidatePath(`/events/${photo.eventId}`);
};

export const uploadVendorPhoto = async (formData: FormData) => {
  const user = await requireAuth();
  requireVendor(user);

  const vendorId = String(formData.get("vendorId") ?? "");
  if (!vendorId) throw new Error("vendorId is required");
  await assertVendorOwnership(vendorId, user.id, user.role);

  const type = parseVendorPhotoType(formData.get("type"));
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("image");
  if (!(file instanceof File)) throw new Error("Image file is required");

  const uploaded = await uploadImageToBlob({ file, prefix: `vendors/${vendorId}` });

  await prisma.vendorPhoto.create({
    data: {
      vendorId,
      type,
      caption,
      imageUrl: uploaded.url,
      fileName: uploaded.fileName,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
    },
  });

  revalidatePath("/dashboard/media");
  revalidatePath(`/bakeries/${vendorId}`);
  revalidatePath("/events");
};

export const deleteVendorPhoto = async (formData: FormData) => {
  const user = await requireAuth();
  requireVendor(user);

  const photoId = String(formData.get("photoId") ?? "");
  if (!photoId) throw new Error("photoId is required");

  const photo = await prisma.vendorPhoto.findUnique({
    where: { id: photoId },
    include: { vendor: true },
  });
  if (!photo) throw new Error("Vendor photo not found");
  if (user.role !== "ADMIN" && photo.vendor.userId !== user.id) {
    throw new Error("Forbidden: not your bakery profile");
  }

  await prisma.vendorPhoto.delete({ where: { id: photoId } });

  revalidatePath("/dashboard/media");
  revalidatePath(`/bakeries/${photo.vendorId}`);
  revalidatePath("/events");
};
