import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type StepKey = "photos" | "amenities" | "vendors";

const STEP_TITLE: Record<StepKey, string> = {
  photos: "写真を追加",
  amenities: "アメニティを予約する",
  vendors: "出店するお店を決める",
};

const STEP_DESCRIPTION: Record<StepKey, string> = {
  photos: "イベント写真を登録して公開ページを整えます。",
  amenities: "必要備品を選んで予約状況を固めます。",
  vendors: "申請を確認して出店店舗を決定します。",
};

const STEP_LINK: Record<StepKey, string> = {
  photos: "/dashboard/media",
  amenities: "equipment",
  vendors: "applications",
};

export default async function EventNextStepsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { organizer: true },
  });
  if (!event) notFound();
  if (user.role !== "ADMIN" && event.organizer.userId !== user.id) {
    redirect("/organizer/events");
  }

  const [photoCount, amenityCount, acceptedVendorCount] = await Promise.all([
    prisma.eventPhoto.count({ where: { eventId: id } }),
    prisma.equipmentBooking.count({
      where: { eventId: id, status: { in: ["REQUESTED", "CONFIRMED"] } },
    }),
    prisma.application.count({ where: { eventId: id, status: "ACCEPTED" } }),
  ]);

  const done = {
    photos: photoCount > 0,
    amenities: amenityCount > 0,
    vendors: acceptedVendorCount > 0,
  };

  const totalDone = Number(done.photos) + Number(done.amenities) + Number(done.vendors);
  const completedAll = totalDone === 3;

  const stepParam = (await searchParams).step as StepKey | undefined;
  const fallbackStep: StepKey = !done.photos ? "photos" : !done.amenities ? "amenities" : "vendors";
  const selectedStep: StepKey =
    stepParam && ["photos", "amenities", "vendors"].includes(stepParam) ? stepParam : fallbackStep;

  const isActive = (key: StepKey) => key === selectedStep;

  return (
    <div className="space-y-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          イベント作成が完了しました。次のタスクを進めて公開準備を完了させましょう。
        </p>
        <Link href={`/organizer/events/${id}/plan`} className="text-sm underline" style={{ color: "var(--accent)" }}>
          計画ダッシュボードを見る
        </Link>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <StepPill label="イベント作成" active={true} done={true} />
          <Connector />
          <StepPill label={STEP_TITLE.photos} active={isActive("photos")} done={done.photos} />
          <Connector />
          <StepPill label={STEP_TITLE.amenities} active={isActive("amenities")} done={done.amenities} />
          <Connector />
          <StepPill label={STEP_TITLE.vendors} active={isActive("vendors")} done={done.vendors} />
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          進捗: {totalDone}/3 完了
        </p>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-sm font-medium">{STEP_TITLE[selectedStep]}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {STEP_DESCRIPTION[selectedStep]}
        </p>
      </div>

      <div className="space-y-3">
        {(Object.keys(STEP_TITLE) as StepKey[]).map((key) => {
          const href =
            key === "photos"
              ? STEP_LINK[key]
              : `/organizer/events/${id}/${STEP_LINK[key]}`;
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl p-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
            >
              <div className="space-y-1">
                <p className="font-medium">{STEP_TITLE[key]}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {STEP_DESCRIPTION[key]}
                </p>
                <Link
                  href={`/organizer/events/${id}/next-steps?step=${key}`}
                  className="text-xs"
                  style={{ color: "var(--accent)" }}
                >
                  このステップを選択
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={done[key]} readOnly className="h-5 w-5 accent-orange-500" />
                <Link
                  href={href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  進む
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {completedAll && (
        <div
          className="rounded-xl p-4"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--success-light)" }}
        >
          <p className="font-medium" style={{ color: "var(--success)" }}>
            すべての準備タスクが完了しました。
          </p>
          <Link href={`/events/${id}`} className="mt-2 inline-block text-sm underline" style={{ color: "var(--accent)" }}>
            公開ページを確認する
          </Link>
        </div>
      )}
    </div>
  );
}

const StepPill = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <span
    className="rounded-full px-3 py-1 text-xs font-medium"
    style={{
      backgroundColor: active || done ? "var(--accent)" : "var(--accent-light)",
      color: active || done ? "white" : "var(--muted)",
    }}
  >
    {label}
  </span>
);

const Connector = () => <span style={{ color: "var(--muted)" }}>→</span>;
