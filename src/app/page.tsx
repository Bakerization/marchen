import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="py-8 space-y-10">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src="/library.jpeg"
          alt="パンマルシェの風景"
          width={1200}
          height={500}
          className="w-full h-[400px] object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            パンマルシェ、<br />開いてみませんか？
          </h1>
          <p className="mt-3 text-lg text-white/90">
            地方公共団体のためのマルシェ運営プラットフォーム
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className="rounded-xl p-6 space-y-2"
          style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl">📋</p>
          <h3 className="font-semibold" style={{ color: "var(--accent)" }}>企画から運営まで</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            AIチャットアシスタントが、マルシェの企画・パン屋の選定・日程調整・当日運営まで全てサポート。
          </p>
        </div>
        <div
          className="rounded-xl p-6 space-y-2"
          style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl">🍞</p>
          <h3 className="font-semibold" style={{ color: "var(--accent)" }}>パン屋さんとつながる</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            面談日程の調整から出店確認まで、スマホ対応の簡単操作でパン屋さんとスムーズに連携。
          </p>
        </div>
        <div
          className="rounded-xl p-6 space-y-2"
          style={{ backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl">📊</p>
          <h3 className="font-semibold" style={{ color: "var(--accent)" }}>報告書も自動作成</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            売上管理から会計報告・活動報告書まで、地方公共団体に必要な書類をワンクリックで。
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Link
          href="/guide"
          className="inline-block rounded-lg px-8 py-3 text-base font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          使い方を見る
        </Link>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          デモ版をお試しいただけます。
          <Link href="/login" className="underline ml-1" style={{ color: "var(--accent)" }}>
            ログインはこちら
          </Link>
        </p>
      </div>
    </div>
  );
}
