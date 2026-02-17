"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireVendor } from "@/lib/rbac";

export const getVendorProfile = async () => {
  const user = await requireAuth();
  requireVendor(user);

  return prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    include: { user: { select: { email: true, name: true } } },
  });
};

export const updateVendorProfile = async (data: {
  shopName: string;
  description?: string;
  category?: string;
  contactPhone?: string;
}) => {
  const user = await requireAuth();
  requireVendor(user);

  const existing = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!existing) throw new Error("Vendor profile not found");

  return prisma.vendorProfile.update({
    where: { id: existing.id },
    data: {
      shopName: data.shopName,
      description: data.description ?? null,
      category: data.category ?? null,
      contactPhone: data.contactPhone ?? null,
    },
  });
};
