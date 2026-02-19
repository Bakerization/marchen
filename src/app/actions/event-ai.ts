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

const toDateTimeLocal = (value: unknown) => {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");
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

export const generateEventDraft = async (
  prompt: string,
): Promise<DraftInput> => {
  const user = await requireAuth();
  requireOrganizer(user);

  const userPrompt = prompt.trim();
  if (!userPrompt) {
    throw new Error("要件を入力してください");
  }

  const result = await generateText({
    model: getModel(),
    system: `あなたは自治体向けパンマルシェ企画アシスタントです。
与えられた要件を基に、イベント作成フォーム入力用のJSONだけを返してください。

返却フォーマット:
{
  "title": "string",
  "description": "string",
  "location": "string",
  "eventDate": "YYYY-MM-DDTHH:mm",
  "deadline": "YYYY-MM-DDTHH:mm",
  "maxVendors": number
}

ルール:
- 日本語で自然な内容
- deadline は eventDate より前
- 日付が曖昧なら妥当な近い将来の日付を仮設定
- JSON以外の文章は返さない`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawJson = extractJson(result.text);
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;

  const draft: DraftInput = {
    title: cleanText(parsed.title, "パンマルシェ"),
    description: cleanText(parsed.description),
    location: cleanText(parsed.location),
    eventDate: toDateTimeLocal(parsed.eventDate),
    deadline: toDateTimeLocal(parsed.deadline),
    maxVendors: parseNumber(parsed.maxVendors),
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

  const currentDraftText = JSON.stringify(params.currentDraft);
  const result = await generateText({
    model: getModel(),
    system: `あなたはパンマルシェ新規作成ページのAI相談アシスタントです。
ユーザーがイベント案を固められるよう、具体的かつ短く助言してください。
必要に応じて、タイトル案・説明文案・開催日時・締切・最大出店数を提案してください。
現在のフォーム値(JSON): ${currentDraftText}`,
    messages: [...history, { role: "user", content: message }],
  });

  return { reply: result.text.trim() };
};

