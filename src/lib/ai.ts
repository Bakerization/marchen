import { openai } from "@ai-sdk/openai";

export const WORKFLOW_STEPS = [
  { id: "plan", label: "企画構想", description: "イベントの目的・コンセプトを決める" },
  { id: "vendor_select", label: "パン屋選定", description: "出店してほしいパン屋をリストアップ" },
  { id: "meeting", label: "面談日程調整", description: "パン屋さんとの面談を設定" },
  { id: "schedule", label: "開催日決定", description: "全員の予定を元に開催日を確定" },
  { id: "equipment", label: "備品手配", description: "テント・テーブルなどの備品を手配" },
  { id: "staffing", label: "人員計画", description: "スタッフ・ボランティアの人数と配置" },
  { id: "announce", label: "告知作成", description: "イベント告知ページ・ポスター仕様書" },
  { id: "dayof", label: "当日運営", description: "天気確認・売上管理・決済" },
  { id: "report", label: "事後報告", description: "会計報告・活動報告・感想収集" },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]["id"];

const SYSTEM_PROMPT = `あなたは「Marchen」のパンマルシェ開催アシスタントです。
地方公共団体の担当者がパンマルシェ（パンのマーケットイベント）を企画・運営するのを支援します。

## ワークフロー
以下のステップ順にユーザーを案内してください：
1. 企画構想 — イベントの目的、コンセプト、ターゲット層を一緒に考える
2. パン屋選定 — 出店してほしいパン屋のリストアップ、優先度付け
3. 面談日程調整 — パン屋さんとの面談スケジュール設定
4. 開催日決定 — 全ベンダーの都合を考慮した最適な開催日の提案
5. 備品手配 — テント、テーブル、電源などの必要備品リスト作成
6. 人員計画 — スタッフ・ボランティアの必要人数と役割分担
7. 告知作成 — イベント告知ページやポスター用の仕様書作成
8. 当日運営 — 天気確認、売上管理、決済フローの準備
9. 事後報告 — 会計報告書、活動報告書の作成、感想収集

## 注意事項
- 日本語で丁寧に対応してください
- 具体的な提案をしてください（例：「30ブースの場合、スタッフは最低15名必要です」）
- ユーザーの入力に基づいて、次のステップへ自然に誘導してください
- 予算や規模に関する質問には、一般的な地方公共団体のイベント相場を参考に回答してください
- 現在のステップがわかるように、回答の最初に【現在のステップ名】を表示してください`;

export const getModel = () => openai("gpt-4o-mini");

export const getSystemPrompt = (eventTitle?: string) => {
  const base = SYSTEM_PROMPT;
  if (eventTitle) {
    return `${base}\n\n## 現在のイベント\nイベント名: ${eventTitle}`;
  }
  return base;
};
