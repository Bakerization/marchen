import { prisma } from "@/lib/prisma";
import type { Role } from "@/types/auth";

export type PlanSectionId =
  | "concept"
  | "shops"
  | "amenities"
  | "publicity"
  | "post_report"
  | "comments";

export type PlanTask = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
};

export type PlanSection = {
  id: PlanSectionId;
  title: string;
  description: string;
  tasks: PlanTask[];
  doneCount: number;
  totalCount: number;
  completed: boolean;
  href: string;
};

export type EventPlanData = {
  event: {
    id: string;
    title: string;
    status: string;
    organizerUserId: string;
  };
  sections: PlanSection[];
  completedSections: number;
  totalSections: number;
  completedTasks: number;
  totalTasks: number;
};

const sectionHref = (eventId: string, sectionId: PlanSectionId) =>
  `/organizer/events/${eventId}/plan/${sectionId}`;

export const getEventPlanData = async (
  eventId: string,
  user: { id: string; role: Role },
): Promise<EventPlanData | null> => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) return null;
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    throw new Error("Forbidden: not your event");
  }

  const [
    eventPhotoCount,
    vendorTargetCount,
    acceptedAppCount,
    meetingCount,
    equipmentCount,
    staffingCount,
    volunteerConfirmedCount,
    notificationCount,
    salesCount,
    feedbackCount,
    publicFeedbackCount,
    accountingReportCount,
    activityReportCount,
    specGeneratedCount,
    feedbackAuditCount,
  ] = await Promise.all([
    prisma.eventPhoto.count({ where: { eventId } }),
    prisma.vendorTarget.count({ where: { eventId } }),
    prisma.application.count({ where: { eventId, status: "ACCEPTED" } }),
    prisma.meetingSlot.count({ where: { eventId } }),
    prisma.equipmentBooking.count({
      where: { eventId, status: { in: ["REQUESTED", "CONFIRMED"] } },
    }),
    prisma.staffingPlan.count({ where: { eventId } }),
    prisma.volunteerInvite.count({ where: { eventId, status: "CONFIRMED" } }),
    prisma.notification.count({ where: { eventId } }),
    prisma.salesRecord.count({ where: { eventId } }),
    prisma.feedback.count({ where: { eventId } }),
    prisma.feedback.count({ where: { eventId, isPublic: true } }),
    prisma.auditLog.count({ where: { eventId, action: "ACCOUNTING_REPORT_GENERATED" } }),
    prisma.auditLog.count({ where: { eventId, action: "ACTIVITY_REPORT_GENERATED" } }),
    prisma.auditLog.count({ where: { eventId, action: "SPEC_GENERATED" } }),
    prisma.auditLog.count({ where: { eventId, action: "FEEDBACK_VISIBILITY_TOGGLED" } }),
  ]);

  const sectionsBase: Array<Omit<PlanSection, "doneCount" | "totalCount" | "completed">> = [
    {
      id: "concept",
      title: "全体構想",
      description: "イベントの基本設計と公開準備を固めます。",
      href: sectionHref(eventId, "concept"),
      tasks: [
        {
          id: "concept-basic",
          title: "基本情報を入力",
          description: "説明・開催場所・最大出店数を設定",
          done: Boolean(event.description && event.location && event.maxVendors),
          href: `/organizer/events/${eventId}/edit`,
        },
        {
          id: "concept-publish",
          title: "公開ステータスを設定",
          description: "募集開始できる状態にする",
          done: event.status === "OPEN" || event.status === "CLOSED" || event.status === "COMPLETED",
          href: `/organizer/events/${eventId}/applications`,
        },
        {
          id: "concept-spec",
          title: "仕様書を生成",
          description: "企画仕様を明文化して確認",
          done: specGeneratedCount > 0,
          href: `/organizer/events/${eventId}/spec`,
        },
      ],
    },
    {
      id: "shops",
      title: "お店との接続",
      description: "候補選定から面談・確定まで進めます。",
      href: sectionHref(eventId, "shops"),
      tasks: [
        {
          id: "shops-targets",
          title: "候補店舗を登録",
          description: "優先度つきで候補を作成",
          done: vendorTargetCount > 0,
          href: `/organizer/events/${eventId}/meetings`,
        },
        {
          id: "shops-meetings",
          title: "面談日程を設定",
          description: "面談スロットを作成",
          done: meetingCount > 0,
          href: `/organizer/events/${eventId}/meetings`,
        },
        {
          id: "shops-accept",
          title: "出店店舗を確定",
          description: "承認済み出店者を作る",
          done: acceptedAppCount > 0,
          href: `/organizer/events/${eventId}/applications`,
        },
      ],
    },
    {
      id: "amenities",
      title: "アメニティの注文",
      description: "備品・人員・ボランティア体制を整えます。",
      href: sectionHref(eventId, "amenities"),
      tasks: [
        {
          id: "amenities-equip",
          title: "備品を予約",
          description: "必要備品をREQUESTED/CONFIRMEDにする",
          done: equipmentCount > 0,
          href: `/organizer/events/${eventId}/equipment`,
        },
        {
          id: "amenities-staffing",
          title: "人員計画を作成",
          description: "役割ごとに必要人数を設定",
          done: staffingCount > 0,
          href: `/organizer/events/${eventId}/staffing`,
        },
        {
          id: "amenities-volunteer",
          title: "ボランティアを確保",
          description: "確定ボランティアを登録",
          done: volunteerConfirmedCount > 0,
          href: `/organizer/events/${eventId}/volunteers`,
        },
      ],
    },
    {
      id: "publicity",
      title: "広報",
      description: "告知素材と公開導線を整備します。",
      href: sectionHref(eventId, "publicity"),
      tasks: [
        {
          id: "publicity-photo",
          title: "イベント写真を追加",
          description: "公開ページ用の写真を登録",
          done: eventPhotoCount > 0,
          href: "/dashboard/media",
        },
        {
          id: "publicity-notification",
          title: "告知通知を準備",
          description: "メール/DMの通知を作成",
          done: notificationCount > 0,
          href: `/organizer/events/${eventId}/applications`,
        },
        {
          id: "publicity-public-page",
          title: "公開ページを確認",
          description: "イベント詳細ページを公開確認",
          done: event.status === "OPEN" || event.status === "CLOSED" || event.status === "COMPLETED",
          href: `/events/${eventId}`,
        },
      ],
    },
    {
      id: "post_report",
      title: "終わった後の報告書",
      description: "売上記録と報告書作成を完了します。",
      href: sectionHref(eventId, "post_report"),
      tasks: [
        {
          id: "post-sales",
          title: "売上データを記録",
          description: "売上記録を登録",
          done: salesCount > 0,
          href: `/organizer/events/${eventId}/sales`,
        },
        {
          id: "post-accounting",
          title: "会計報告書を生成",
          description: "会計レポートを一度は出力",
          done: accountingReportCount > 0,
          href: `/organizer/events/${eventId}/reports`,
        },
        {
          id: "post-activity",
          title: "活動報告書を生成",
          description: "活動レポートを一度は出力",
          done: activityReportCount > 0,
          href: `/organizer/events/${eventId}/reports`,
        },
      ],
    },
    {
      id: "comments",
      title: "コメント管理",
      description: "感想収集と公開可否の管理を行います。",
      href: sectionHref(eventId, "comments"),
      tasks: [
        {
          id: "comments-collected",
          title: "感想を収集",
          description: "少なくとも1件の感想を受け取る",
          done: feedbackCount > 0,
          href: `/events/${eventId}/feedback`,
        },
        {
          id: "comments-published",
          title: "公開コメントを設定",
          description: "公開コメントを1件以上にする",
          done: publicFeedbackCount > 0,
          href: `/organizer/events/${eventId}/reports`,
        },
        {
          id: "comments-reviewed",
          title: "コメントをレビュー",
          description: "公開/非公開の切替を実施",
          done: feedbackAuditCount > 0,
          href: `/organizer/events/${eventId}/reports`,
        },
      ],
    },
  ];

  const sections: PlanSection[] = sectionsBase.map((section) => {
    const doneCount = section.tasks.filter((task) => task.done).length;
    const totalCount = section.tasks.length;
    return {
      ...section,
      doneCount,
      totalCount,
      completed: doneCount === totalCount,
    };
  });

  const completedSections = sections.filter((section) => section.completed).length;
  const totalSections = sections.length;
  const completedTasks = sections.reduce((sum, section) => sum + section.doneCount, 0);
  const totalTasks = sections.reduce((sum, section) => sum + section.totalCount, 0);

  return {
    event: {
      id: event.id,
      title: event.title,
      status: event.status,
      organizerUserId: event.organizer.userId,
    },
    sections,
    completedSections,
    totalSections,
    completedTasks,
    totalTasks,
  };
};

