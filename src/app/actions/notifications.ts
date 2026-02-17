"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const generateInstagramDM = async (data: {
  vendorName: string;
  eventTitle: string;
  eventDate: string;
  inviteUrl: string;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const message = `${data.vendorName}様

突然のご連絡失礼いたします。
「${data.eventTitle}」（${data.eventDate}）の開催にあたり、ぜひ${data.vendorName}様にご出店いただきたく、ご連絡させていただきました。

面談の候補日をご確認いただけますと幸いです。
下記リンクからご都合の良い日時をお選びください：
${data.inviteUrl}

ご不明な点がございましたらお気軽にお問い合わせください。
よろしくお願いいたします。`;

  await logAudit({
    userId: user.id,
    action: "INSTAGRAM_DM_GENERATED",
    details: `Generated DM text for ${data.vendorName}`,
  });

  return message;
};

export const createNotification = async (data: {
  channel: "EMAIL" | "INSTAGRAM_DM";
  toAddress: string;
  subject?: string;
  body: string;
  eventId?: string;
  vendorProfileId?: string;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const notification = await prisma.notification.create({
    data: {
      channel: data.channel,
      toAddress: data.toAddress,
      subject: data.subject,
      body: data.body,
      eventId: data.eventId,
      vendorProfileId: data.vendorProfileId,
    },
  });

  await logAudit({
    userId: user.id,
    action: "NOTIFICATION_CREATED",
    eventId: data.eventId,
    details: `${data.channel} to ${data.toAddress}`,
  });

  return notification;
};
