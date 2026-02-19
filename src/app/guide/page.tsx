import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { AppSidebarShell } from "@/components/AppSidebarShell";

export default async function GuidePage() {
  const user = await getSessionUser();
  return (
    <AppSidebarShell user={user}>
      <div className="py-2 space-y-10 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
          Marchenの使い方
        </h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          デモ版の使い方をステップごとにご案内します。
        </p>
      </div>

      {/* デモアカウント */}
      <section
        className="rounded-xl p-6 space-y-4"
        style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-xl font-semibold" style={{ color: "var(--accent)" }}>
          Step 0: デモアカウントでログイン
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          デモ版では3種類のアカウントをご用意しています。全てパスワードは共通です。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th className="text-left py-2 pr-4">役割</th>
                <th className="text-left py-2 pr-4">メールアドレス</th>
                <th className="text-left py-2 pr-4">パスワード</th>
                <th className="text-left py-2">説明</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-4 font-medium" style={{ color: "var(--accent)" }}>主催者</td>
                <td className="py-2 pr-4 font-mono text-xs">organizer@marchen.local</td>
                <td className="py-2 pr-4 font-mono text-xs">password123</td>
                <td className="py-2" style={{ color: "var(--muted)" }}>マルシェを企画・運営する自治体担当者</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-4 font-medium" style={{ color: "var(--accent)" }}>出店者1</td>
                <td className="py-2 pr-4 font-mono text-xs">vendor1@marchen.local</td>
                <td className="py-2 pr-4 font-mono text-xs">password123</td>
                <td className="py-2" style={{ color: "var(--muted)" }}>パン屋「Sato&apos;s Kitchen」</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-4 font-medium" style={{ color: "var(--accent)" }}>出店者2</td>
                <td className="py-2 pr-4 font-mono text-xs">vendor2@marchen.local</td>
                <td className="py-2 pr-4 font-mono text-xs">password123</td>
                <td className="py-2" style={{ color: "var(--muted)" }}>「Hana Crafts」</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium" style={{ color: "var(--accent)" }}>管理者</td>
                <td className="py-2 pr-4 font-mono text-xs">admin@marchen.local</td>
                <td className="py-2 pr-4 font-mono text-xs">password123</td>
                <td className="py-2" style={{ color: "var(--muted)" }}>全権限を持つ管理者</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Link
          href="/login"
          className="inline-block rounded-lg px-6 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          ログインページへ
        </Link>
      </section>

      {/* 主催者の使い方 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: "var(--accent)" }}>
          主催者（オーガナイザー）としての使い方
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--accent-light)" }}>organizer@marchen.local</code> でログインしてお試しください。
        </p>

        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "イベントを作成する",
              desc: "「新規イベント作成」からパンマルシェの基本情報（名前・日時・場所・最大出店数）を入力します。作成直後は「下書き」状態です。",
              link: "/organizer/events/new",
              linkLabel: "新規イベント作成",
            },
            {
              step: "2",
              title: "AIチャットで企画を相談する",
              desc: "イベント一覧から「AIチャット」をクリック。AIアシスタントがパンマルシェの企画・パン屋選定・日程調整・備品手配・人員計画まで全てガイドします。",
            },
            {
              step: "3",
              title: "パン屋さんとの面談を調整する",
              desc: "「面談管理」でGoogle Calendarと連携し、空き時間を提案。候補日をパン屋さんに送ると、スマホ対応の専用ページで日程を選んでもらえます。",
            },
            {
              step: "4",
              title: "イベントを公開して申請を受け付ける",
              desc: "「公開する」ボタンでイベントを公開。パン屋さんからの出店申請を受け付け、承認・却下を管理できます。",
            },
            {
              step: "5",
              title: "備品を手配する",
              desc: "「備品」ページでテント・テーブル・椅子などをカタログから選択。自治体所有品は無料で利用できます。",
            },
            {
              step: "6",
              title: "人員計画とボランティア招待",
              desc: "「人員」ページでAIが必要スタッフ数を算出。「ボランティア」ページでメールアドレスを入力して招待メールを送信できます。",
            },
            {
              step: "7",
              title: "仕様書を生成してデザイナーに共有",
              desc: "「仕様書」ページでイベント情報・出店者一覧をまとめた仕様書を自動生成。ワンクリックでクリップボードにコピーできます。",
            },
            {
              step: "8",
              title: "当日: 売上を記録する",
              desc: "「売上」ページで出店者ごとの売上を記録。PayPay・現金など支払方法別に管理できます。",
            },
            {
              step: "9",
              title: "事後: レポートを生成する",
              desc: "「レポート」ページで会計報告書・活動報告書をワンクリック生成。地方公共団体の報告用フォーマットで出力されます。",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl p-4 flex gap-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
                {item.link && (
                  <Link
                    href={item.link}
                    className="text-sm mt-2 inline-block"
                    style={{ color: "var(--accent)" }}
                  >
                    {item.linkLabel} &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 出店者の使い方 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: "var(--accent)" }}>
          出店者（ベンダー）としての使い方
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "var(--accent-light)" }}>vendor1@marchen.local</code> でログインしてお試しください。
        </p>

        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "イベントを探す",
              desc: "「イベント一覧」から募集中のマルシェを探します。",
            },
            {
              step: "2",
              title: "出店申請する",
              desc: "イベント詳細ページで「出店申請する」ボタンをクリック。メッセージを添えて申請できます。",
            },
            {
              step: "3",
              title: "面談日を選ぶ",
              desc: "主催者から届いた面談招待リンクをクリックし、都合の良い日時を選びます。ログイン不要でスマホからも操作可能です。",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl p-4 flex gap-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 一般の方 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: "var(--accent)" }}>
          一般の方（ログイン不要）
        </h2>
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm">以下の機能はログインなしでご利用いただけます:</p>
          <ul className="list-disc list-inside text-sm space-y-1" style={{ color: "var(--muted)" }}>
            <li>イベント一覧の閲覧</li>
            <li>イベント詳細（出店者一覧）の閲覧</li>
            <li>ボランティアへの応募（メールアドレスのみ）</li>
            <li>イベント後の感想投稿</li>
            <li>面談招待リンクからの日程選択</li>
          </ul>
        </div>
      </section>

      <div className="text-center pt-4">
        <Link
          href="/login"
          className="inline-block rounded-lg px-8 py-3 text-base font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          さっそく試してみる
        </Link>
      </div>
      </div>
    </AppSidebarShell>
  );
}
