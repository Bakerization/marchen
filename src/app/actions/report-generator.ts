"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const generateAccountingReport = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      budgets: true,
      equipmentBookings: true,
      salesRecords: true,
    },
  });

  if (!event) throw new Error("Event not found");
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const totalBudgetPlanned = event.budgets.reduce((s, b) => s + b.plannedYen, 0);
  const totalBudgetActual = event.budgets.reduce((s, b) => s + (b.actualYen ?? 0), 0);
  const totalEquipmentCost = event.equipmentBookings.reduce((s, e) => s + (e.costYen ?? 0), 0);
  const totalSales = event.salesRecords.reduce((s, r) => s + r.amountYen, 0);

  const report = `# 会計報告書 — ${event.title}

## 基本情報
- **イベント名**: ${event.title}
- **開催日**: ${event.eventDate.toLocaleDateString("ja-JP")}
- **主催**: ${event.organizer.organizationName}
- **報告日**: ${new Date().toLocaleDateString("ja-JP")}

## 予算
| カテゴリ | 予算額 | 実績額 | 差額 |
|---------|--------|--------|------|
${event.budgets.map((b) => `| ${b.category} | ¥${b.plannedYen.toLocaleString()} | ¥${(b.actualYen ?? 0).toLocaleString()} | ¥${((b.actualYen ?? 0) - b.plannedYen).toLocaleString()} |`).join("\n")}
| **合計** | **¥${totalBudgetPlanned.toLocaleString()}** | **¥${totalBudgetActual.toLocaleString()}** | **¥${(totalBudgetActual - totalBudgetPlanned).toLocaleString()}** |

## 備品費用
| 品名 | 数量 | 費用 |
|------|------|------|
${event.equipmentBookings.map((e) => `| ${e.itemName} | ${e.quantity} | ¥${(e.costYen ?? 0).toLocaleString()} |`).join("\n")}
| **合計** | | **¥${totalEquipmentCost.toLocaleString()}** |

## 売上
| 出店者 | 金額 | 支払方法 |
|--------|------|----------|
${event.salesRecords.map((r) => `| ${r.vendorName} | ¥${r.amountYen.toLocaleString()} | ${r.paymentMethod ?? "現金"} |`).join("\n")}
| **合計** | **¥${totalSales.toLocaleString()}** | |

## サマリー
- **総支出**: ¥${(totalBudgetActual + totalEquipmentCost).toLocaleString()}
- **総売上**: ¥${totalSales.toLocaleString()}
- **収支**: ¥${(totalSales - totalBudgetActual - totalEquipmentCost).toLocaleString()}

---
*この報告書は Marchen により自動生成されました。*
`;

  await logAudit({
    userId: user.id,
    action: "ACCOUNTING_REPORT_GENERATED",
    eventId,
    details: `Generated accounting report for ${event.title}`,
  });

  return report;
};

export const generateActivityReport = async (eventId: string) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      applications: { where: { status: "ACCEPTED" }, include: { vendor: true } },
      volunteerInvites: { where: { status: "CONFIRMED" } },
      salesRecords: true,
      feedbacks: { where: { isPublic: true } },
    },
  });

  if (!event) throw new Error("Event not found");
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const totalSales = event.salesRecords.reduce((s, r) => s + r.amountYen, 0);
  const avgRating = event.feedbacks.filter((f) => f.rating).length > 0
    ? (event.feedbacks.reduce((s, f) => s + (f.rating ?? 0), 0) / event.feedbacks.filter((f) => f.rating).length).toFixed(1)
    : "N/A";

  const report = `# 活動報告書 — ${event.title}

## 基本情報
- **イベント名**: ${event.title}
- **開催日**: ${event.eventDate.toLocaleDateString("ja-JP")}
- **開催場所**: ${event.location ?? "未記載"}
- **主催**: ${event.organizer.organizationName}

## イベント概要
${event.description ?? "（説明未設定）"}

## 実績
- **出店者数**: ${event.applications.length} 店舗
- **ボランティア数**: ${event.volunteerInvites.length} 名
- **総売上**: ¥${totalSales.toLocaleString()}
- **平均評価**: ${avgRating} / 5.0

## 出店者一覧
${event.applications.map((a, i) => `${i + 1}. ${a.vendor.shopName}${a.vendor.category ? ` (${a.vendor.category})` : ""}`).join("\n")}

## 参加者の声
${event.feedbacks.length > 0 ? event.feedbacks.map((f) => `> ${f.content}\n> — ${f.authorName ?? "匿名"}${f.rating ? ` (${f.rating}/5)` : ""}`).join("\n\n") : "（感想なし）"}

## 今後の改善点
（担当者が記入してください）

---
*この報告書は Marchen により自動生成されました。*
*報告日: ${new Date().toLocaleDateString("ja-JP")}*
`;

  await logAudit({
    userId: user.id,
    action: "ACTIVITY_REPORT_GENERATED",
    eventId,
    details: `Generated activity report for ${event.title}`,
  });

  return report;
};
