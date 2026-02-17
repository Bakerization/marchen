import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "管理者",
  ORGANIZER: "主催者（オーガナイザー）",
  VENDOR: "出店者（ベンダー）",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="py-12 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>

      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>ログイン中</p>
        <p className="mt-1 font-semibold text-lg">{user.name ?? user.email}</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          権限: <span className="font-medium" style={{ color: "var(--accent)" }}>{ROLE_LABEL[user.role] ?? user.role}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(user.role === "ORGANIZER" || user.role === "ADMIN") && (
          <>
            <Link
              href="/organizer/events"
              className="rounded-xl p-5 transition-colors"
              style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
            >
              <p className="font-semibold" style={{ color: "var(--accent)" }}>イベント管理</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                イベントの作成・管理・申請の確認
              </p>
            </Link>
            <Link
              href="/organizer/events/new"
              className="rounded-xl p-5 transition-colors"
              style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
            >
              <p className="font-semibold" style={{ color: "var(--accent)" }}>新規イベント作成</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                新しいパンマルシェを企画する
              </p>
            </Link>
          </>
        )}
        {(user.role === "VENDOR" || user.role === "ADMIN") && (
          <Link
            href="/events"
            className="rounded-xl p-5 transition-colors"
            style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--accent)" }}>イベント一覧</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              開催中のイベントを見る・出店申請する
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
