"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const generateEventSpec = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      applications: {
        where: { status: "ACCEPTED" },
        include: { vendor: true },
      },
      equipmentBookings: true,
      staffingPlans: true,
      volunteerInvites: { where: { status: "CONFIRMED" } },
    },
  });

  if (!event) throw new Error("Event not found");
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const vendors = event.applications.map((a) => a.vendor);
  const eventDate = event.eventDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const spec = `# ${event.title} — イベント仕様書

## 基本情報
- **イベント名**: ${event.title}
- **開催日時**: ${eventDate}
- **開催場所**: ${event.location ?? "未定"}
- **主催**: ${event.organizer.organizationName}
${event.organizer.contactPhone ? `- **連絡先**: ${event.organizer.contactPhone}` : ""}
${event.organizer.website ? `- **ウェブサイト**: ${event.organizer.website}` : ""}

## イベント概要
${event.description ?? "（説明未設定）"}

## 出店者一覧（${vendors.length}店舗）
${vendors.length > 0 ? vendors.map((v, i) => `${i + 1}. **${v.shopName}**${v.category ? ` (${v.category})` : ""}${v.description ? ` — ${v.description}` : ""}`).join("\n") : "（出店者未確定）"}

## 規模
- **最大出店数**: ${event.maxVendors ?? "未設定"}
- **確定出店数**: ${vendors.length}
- **ボランティア確定数**: ${event.volunteerInvites.length}名

## 備品
${event.equipmentBookings.length > 0 ? event.equipmentBookings.map((e) => `- ${e.itemName} × ${e.quantity}${e.costYen ? ` (¥${e.costYen.toLocaleString()})` : ""}`).join("\n") : "（備品未手配）"}

## 人員配置
${event.staffingPlans.length > 0 ? event.staffingPlans.map((s) => `- ${s.role}: ${s.headcount}名`).join("\n") : "（人員計画未設定）"}

---
*この仕様書は Marchen により自動生成されました。*
*生成日: ${new Date().toLocaleDateString("ja-JP")}*
`;

  await logAudit({
    userId: user.id,
    action: "SPEC_GENERATED",
    eventId,
    details: `Generated spec for ${event.title}`,
  });

  return spec;
};
