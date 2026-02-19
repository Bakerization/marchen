"use server";

import { generateText } from "ai";
import { requireAuth } from "@/lib/session";
import { requireOrganizer } from "@/lib/rbac";
import { getModel } from "@/lib/ai";

type DraftInput = {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  deadline: string;
  maxVendors: number | null;
};

const cleanText = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

/**
 * If a parsed date is in the past, advance it by 1-year increments until it's future.
 * This handles cases like "1月14日" when today is Feb 2026 → next Jan 14 = Jan 2027.
 */
const advancePastDate = (date: Date): Date => {
  const now = new Date();
  const result = new Date(date);
  // Give 1-day grace (editing events that started today are still valid)
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  while (result < cutoff) {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result;
};

const toDateTimeLocal = (value: unknown) => {
  const raw = cleanText(value);
  if (!raw) return "";
  let parsed: Date;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    parsed = new Date(raw);
  } else {
    parsed = new Date(raw);
  }
  if (Number.isNaN(parsed.getTime())) return "";
  const advanced = advancePastDate(parsed);
  const year   = advanced.getFullYear();
  const month  = String(advanced.getMonth() + 1).padStart(2, "0");
  const day    = String(advanced.getDate()).padStart(2, "0");
  const hour   = String(advanced.getHours()).padStart(2, "0");
  const minute = String(advanced.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.floor(n));
};

const extractJson = (text: string) => {
  const block = text.match(/```json\s*([\s\S]*?)```/i);
  if (block?.[1]) return block[1];
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  throw new Error("AI response does not contain JSON");
};

/** Returns current date/time formatted in JST, human-readable */
const todayJST = () =>
  new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const generateEventDraft = async (
  prompt: string,
): Promise<DraftInput> => {
  const user = await requireAuth();
  requireOrganizer(user);

  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error("要件を入力してください");
  }

  const today = todayJST();

  const result = await generateText({
    model: getModel(),
    system: `あなたは自治体向けパンマルシェ企画アシスタントです。
与えられた要件を基に、イベント作成フォーム入力用のJSONだけを返してください。

今日の日付・時刻（JST）: ${today}

返却フォーマット:
{
  "title": "string",
  "description": "string",
  "location": "string",
  "eventDate": "YYYY-MM-DDTHH:mm",
  "deadline": "YYYY-MM-DDTHH:mm",
  "maxVendors": number
}

日付ルール:
- 日付は必ず今日（${today}）より後の将来の日付にすること
- 「1月14日に」「3/15に」など月・日のみ指定された場合は、今日から計算して次に来る直近の該当日（例：今日が2026年2月19日なら「1月14日」→ 2027年1月14日）を使用する
- 年が指定されていない場合は、今日以降となる年を選ぶ
- deadline は eventDate より前（eventDate の2〜3週間前が目安）
- 日付が全く曖昧な場合は、今日から3〜4ヶ月後を仮設定する

その他ルール:
- 日本語で自然な内容
- JSON以外の文章は返さない`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawJson = extractJson(result.text);
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;

  const draft: DraftInput = {
    title:       cleanText(parsed.title, "パンマルシェ"),
    description: cleanText(parsed.description),
    location:    cleanText(parsed.location),
    eventDate:   toDateTimeLocal(parsed.eventDate),
    deadline:    toDateTimeLocal(parsed.deadline),
    maxVendors:  parseNumber(parsed.maxVendors),
  };

  if (!draft.eventDate || !draft.deadline) {
    throw new Error("AIが日付を正しく生成できませんでした。もう一度お試しください。");
  }

  return draft;
};

export const chatForEventDraft = async (params: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  currentDraft: Partial<DraftInput>;
}) => {
  const user = await requireAuth();
  requireOrganizer(user);

  const message = params.message.trim();
  if (!message) throw new Error("メッセージを入力してください");

  const history = params.history.slice(-12).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 1500),
  }));

  const today = todayJST();
  const currentDraftText = JSON.stringify(params.currentDraft);

  const result = await generateText({
    model: getModel(),
    system: `あなたはパンマルシェ新規作成ページのAI相談アシスタントです。
ユーザーがイベント案を固められるよう、具体的かつ短く助言してください。
必要に応じて、タイトル案・説明文案・開催日時・締切・最大出店数を提案してください。

今日の日付・時刻（JST）: ${today}

日付に関する注意:
- 日付は必ず今日（${today}）より後の将来の日付を提案すること
- 「1月14日に」「3/15に」など月・日のみ指定された場合は、今日から計算して次に来る直近の該当日を使用する（例：今日が2026年2月19日なら「1月14日」→ 2027年1月14日）
- 年が指定されていない場合は、今日以降となる年を選ぶ

現在のフォーム値（JSON）: ${currentDraftText}

返答はマークダウン形式で。重要な情報は**ボールド**、選択肢はリスト（- ）で、日付提案などは明確に記載してください。`,
    messages: [...history, { role: "user", content: message }],
  });

  return { reply: result.text.trim() };
};
