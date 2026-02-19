"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { createEvent, updateEvent } from "@/app/actions/events";
import { chatForEventDraft, generateEventDraft } from "@/app/actions/event-ai";

interface EventFormProps {
  event?: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    eventDate: Date;
    deadline: Date;
    maxVendors: number | null;
  };
}

const MODELS = ["Claude Sonnet 4.6", "Claude Opus 4.6", "Claude Haiku 4.5"];

const PLAN_FIELDS = [
  { key: "title",      label: "イベント名",   required: true },
  { key: "location",   label: "開催場所",     required: true },
  { key: "eventDate",  label: "開催日時",     required: true },
  { key: "deadline",   label: "申請締切",     required: true },
  { key: "maxVendors", label: "最大出店数",   required: false },
  { key: "description",label: "説明",        required: false },
] as const;

type PlanKey = (typeof PLAN_FIELDS)[number]["key"];

export const EventForm = ({ event }: EventFormProps) => {
  const router = useRouter();

  // ── Core form state ──
  const isEdit = !!event;
  const toDateInput = (d: Date) => new Date(d).toISOString().slice(0, 16);
  const [title,      setTitle]      = useState(event?.title ?? "");
  const [description,setDescription]= useState(event?.description ?? "");
  const [location,   setLocation]   = useState(event?.location ?? "");
  const [eventDate,  setEventDate]  = useState(event ? toDateInput(event.eventDate) : "");
  const [deadline,   setDeadline]   = useState(event ? toDateInput(event.deadline) : "");
  const [maxVendors, setMaxVendors] = useState(event?.maxVendors?.toString() ?? "");

  const planValues: Record<PlanKey, string> = { title, location, eventDate, deadline, maxVendors, description };
  const planSetters: Record<PlanKey, (v: string) => void> = { title: setTitle, location: setLocation, eventDate: setEventDate, deadline: setDeadline, maxVendors: setMaxVendors, description: setDescription };

  // ── Submit ──
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const submitForm = useCallback(async () => {
    setError(null);
    setLoading(true);
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventDate, deadline,
      maxVendors: maxVendors ? Number(maxVendors) : undefined,
    };
    try {
      if (isEdit) {
        await updateEvent(event!.id, data);
        router.push("/organizer/events");
      } else {
        const created = await createEvent(data);
        router.push(`/organizer/events/${created.id}/next-steps`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [title, description, location, eventDate, deadline, maxVendors, isEdit, event, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitForm();
  };

  // ── Chat ──
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput,   setChatInput]   = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "こんにちは！マルシェの企画内容を教えてください。開催日・場所・規模・コンセプトなどを自由に話してもらえると、右の計画欄を自動で埋めていきます。" },
  ]);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [chatInput]);

  // ── AI Plan auto-fill ──
  const [autoFilling, setAutoFilling] = useState(false);

  const applyDraft = (draft: Awaited<ReturnType<typeof generateEventDraft>>) => {
    if (draft.title)      setTitle(draft.title);
    if (draft.location)   setLocation(draft.location);
    if (draft.eventDate)  setEventDate(draft.eventDate);
    if (draft.deadline)   setDeadline(draft.deadline);
    if (draft.maxVendors) setMaxVendors(String(draft.maxVendors));
    if (draft.description)setDescription(draft.description);
  };

  const autoFillFromHistory = (messages: typeof chatMessages) => {
    const text = messages.map((m) => `${m.role === "assistant" ? "AI" : "ユーザー"}: ${m.content}`).join("\n");
    setAutoFilling(true);
    generateEventDraft(text).then(applyDraft).catch(() => {}).finally(() => setAutoFilling(false));
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setError(null);
    setChatLoading(true);
    const nextHistory = [...chatMessages, { role: "user" as const, content: message }];
    setChatMessages(nextHistory);
    setChatInput("");

    try {
      const res = await chatForEventDraft({
        message, history: nextHistory,
        currentDraft: { title, description, location, eventDate, deadline, maxVendors: maxVendors ? Number(maxVendors) : null },
      });
      const updated = [...nextHistory, { role: "assistant" as const, content: res.reply }];
      setChatMessages(updated);
      autoFillFromHistory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AIチャットに失敗しました");
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(e as unknown as React.FormEvent); }
  };

  // ── Plan panel state ──
  const [editingField,     setEditingField]     = useState<PlanKey | null>(null);
  const [editDraft,        setEditDraft]        = useState("");
  const [showMissingWarn,  setShowMissingWarn]  = useState(false);

  const missingRequired = PLAN_FIELDS.filter((f) => f.required && !planValues[f.key]);
  const allRequiredFilled = missingRequired.length === 0;

  const startEdit = (key: PlanKey) => { setEditingField(key); setEditDraft(planValues[key]); };
  const saveEdit  = () => { if (editingField) { planSetters[editingField](editDraft); setEditingField(null); } };

  // ── Model selector ──
  const [selectedModel,  setSelectedModel]  = useState(MODELS[0]);
  const [showModelMenu,  setShowModelMenu]  = useState(false);

  // ── Portal / full-screen ──
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (!mounted || isEdit) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mounted, isEdit]);

  // ── EDIT MODE: simple form ──
  if (isEdit) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="イベント名"  name="title"      required value={title}       onChange={(e) => setTitle(e.target.value)} />
        <Field label="説明"        name="description" as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Field label="開催場所"   name="location"   value={location}    onChange={(e) => setLocation(e.target.value)} />
        <Field label="開催日時"   name="eventDate"  type="datetime-local" required value={eventDate}  onChange={(e) => setEventDate(e.target.value)} />
        <Field label="申請締切日" name="deadline"   type="datetime-local" required value={deadline}   onChange={(e) => setDeadline(e.target.value)} />
        <Field label="最大出店数" name="maxVendors" type="number" value={maxVendors} onChange={(e) => setMaxVendors(e.target.value)} />
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
          {loading && <Spinner />}
          {loading ? "保存中…" : "イベントを更新"}
        </button>
      </form>
    );
  }

  // ── NEW EVENT MODE: 3-column full-screen portal ──
  return (
    <>
      {/* Placeholder while portal mounts */}
      {!mounted && <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}><Spinner /> 読み込み中…</div>}

      {mounted && createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", overflow: "hidden",
            backgroundColor: "var(--background)",
            fontFamily: "var(--font-geist-sans)",
          }}
        >
          {/* ════ LEFT: History sidebar ════ */}
          <aside style={{ width: 220, flexShrink: 0, backgroundColor: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            {/* Logo */}
            <div style={{ padding: "16px 16px 8px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>✦ Marchen AI</p>
              <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>イベント作成アシスタント</p>
            </div>

            {/* New chat */}
            <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
              <button
                onClick={() => {
                  setChatMessages([{ role: "assistant", content: "こんにちは！マルシェの企画内容を教えてください。開催日・場所・規模・コンセプトなどを自由に話してもらえると、右の計画欄を自動で埋めていきます。" }]);
                  setChatInput("");
                  setTitle(""); setDescription(""); setLocation(""); setEventDate(""); setDeadline(""); setMaxVendors("");
                }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--background)", fontSize: 13, cursor: "pointer", color: "var(--foreground)" }}
              >
                <span style={{ fontSize: 16 }}>＋</span> 新しい会話
              </button>
            </div>

            {/* History list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
              <p style={{ fontSize: 10, color: "var(--muted)", padding: "8px 8px 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>現在の会話</p>
              <div style={{ borderRadius: 8, padding: "8px 10px", backgroundColor: "var(--accent-light)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {title || "新規イベント"}
                </p>
                <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>今日</p>
              </div>

              <p style={{ fontSize: 10, color: "var(--muted)", padding: "16px 8px 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>過去の会話</p>
              {["春のパンマルシェ 2025", "夏祭りコラボ企画", "駅前マルシェ vol.2"].map((name) => (
                <button key={name} disabled style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, fontSize: 12, color: "var(--muted)", cursor: "not-allowed", background: "none", border: "none" }}>
                  {name}
                </button>
              ))}
            </div>
          </aside>

          {/* ════ CENTER: Chat interface ════ */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {/* Header */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, backgroundColor: "var(--card)" }}>
              <h1 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>新規イベント作成</h1>
              <a href="/organizer/events" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>✕ 閉じる</a>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {chatMessages.map((msg, i) => (
                <div key={`${msg.role}-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 4, maxWidth: "75%", alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", paddingLeft: 4 }}>
                    {msg.role === "assistant" ? "✦ AI" : "あなた"}
                  </span>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: 14, padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", backgroundColor: msg.role === "user" ? "var(--accent)" : "var(--card)", color: msg.role === "user" ? "white" : "var(--foreground)", border: "1px solid var(--border)" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: "flex-start" }}>
                  <TypingDots />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div style={{ flexShrink: 0, padding: "12px 20px 16px", borderTop: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
              {error && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>{error}</p>}

              {/* Model selector */}
              <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
                <button
                  onClick={() => setShowModelMenu((v) => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--background)", fontSize: 11, color: "var(--muted)", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 10 }}>⬡</span> {selectedModel}
                  <span style={{ fontSize: 9 }}>▾</span>
                </button>
                {showModelMenu && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", zIndex: 10, minWidth: 180, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
                    {MODELS.map((m) => (
                      <button key={m} onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 12, background: m === selectedModel ? "var(--accent-light)" : "none", color: m === selectedModel ? "var(--accent)" : "var(--foreground)", border: "none", cursor: "pointer" }}>
                        {m === selectedModel ? "✓ " : "  "}{m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea + send */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="開催日・場所・規模・コンセプトなどを自由に入力…（Shift+Enterで改行）"
                  rows={1}
                  style={{ flex: 1, resize: "none", minHeight: 44, maxHeight: 200, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--background)", fontSize: 14, color: "var(--foreground)", outline: "none", lineHeight: 1.5, fontFamily: "inherit", overflowY: "auto" }}
                />
                <button
                  onClick={(e) => handleChatSend(e as unknown as React.FormEvent)}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: chatLoading || !chatInput.trim() ? "var(--border)" : "var(--accent)", color: "white", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", transition: "background-color 150ms" }}
                >
                  {chatLoading ? <Spinner /> : <UpArrow />}
                </button>
              </div>
            </div>
          </main>

          {/* ════ RIGHT: Plan panel ════ */}
          <aside style={{ width: 340, flexShrink: 0, backgroundColor: "var(--card)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>📋 イベント計画</p>
                {autoFilling && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--accent)" }}>
                    <Spinner /> <span>更新中…</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>会話から自動入力・手動編集も可能</p>
            </div>

            {/* Plan items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {PLAN_FIELDS.map(({ key, label, required }) => {
                const value = planValues[key];
                const filled = !!value;
                const isEditing = editingField === key;

                return (
                  <div key={key} style={{ borderRadius: 10, border: `1px solid ${filled ? "var(--border)" : required ? "var(--border)" : "var(--border)"}`, backgroundColor: "var(--background)", overflow: "hidden" }}>
                    {/* Field header */}
                    <div
                      onClick={() => !isEditing && startEdit(key)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: isEditing ? "default" : "pointer" }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0, color: filled ? "var(--accent)" : required ? "var(--warning)" : "var(--muted)" }}>
                        {filled ? "✓" : required ? "○" : "–"}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: "var(--foreground)" }}>
                        {label}{required && <span style={{ color: "var(--warning)", marginLeft: 2 }}>*</span>}
                      </span>
                      {!isEditing && (
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>✎</span>
                      )}
                    </div>

                    {/* Value or editor */}
                    {isEditing ? (
                      <div style={{ padding: "0 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {key === "description" ? (
                          <textarea
                            autoFocus rows={3}
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            style={{ width: "100%", resize: "vertical", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12, color: "var(--foreground)", fontFamily: "inherit", boxSizing: "border-box" }}
                          />
                        ) : (
                          <input
                            autoFocus
                            type={key === "eventDate" || key === "deadline" ? "datetime-local" : key === "maxVendors" ? "number" : "text"}
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12, color: "var(--foreground)", fontFamily: "inherit", boxSizing: "border-box" }}
                          />
                        )}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={saveEdit} style={{ flex: 1, padding: "5px", borderRadius: 6, border: "none", backgroundColor: "var(--accent)", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>保存</button>
                          <button onClick={() => setEditingField(null)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>×</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "0 12px 10px" }}>
                        <p style={{ fontSize: 12, color: filled ? "var(--foreground)" : "var(--muted)", fontStyle: filled ? "normal" : "italic" }}>
                          {value || "───────────"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom: warnings + create button */}
            <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
              {/* Missing required warning */}
              {showMissingWarn && !allRequiredFilled && (
                <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--warning-light)", border: "1px solid var(--warning)" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--warning)", marginBottom: 4 }}>以下の項目が未入力です：</p>
                  {missingRequired.map((f) => (
                    <p key={f.key} style={{ fontSize: 11, color: "var(--warning)" }}>• {f.label}</p>
                  ))}
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>未入力のまま作成することもできます。</p>
                </div>
              )}
              {error && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8 }}>{error}</p>}

              <button
                disabled={loading}
                onClick={() => {
                  if (!allRequiredFilled && !showMissingWarn) { setShowMissingWarn(true); return; }
                  submitForm();
                }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 16px", borderRadius: 10, border: "none", backgroundColor: "var(--accent)", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "opacity 150ms" }}
              >
                {loading && <Spinner />}
                {loading ? "作成中…" : allRequiredFilled ? "イベントを作成 →" : "このまま作成する →"}
              </button>

              <p style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", marginTop: 6 }}>
                {allRequiredFilled
                  ? `必須項目がすべて揃っています`
                  : `残り ${missingRequired.length} 項目が未入力`}
              </p>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
};

// ── Sub-components ──

const Spinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const UpArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const TypingDots = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 14px", borderRadius: "4px 18px 18px 18px", backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
    {[0, 160, 320].map((delay) => (
      <span key={delay} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--muted)", display: "inline-block", animationDelay: `${delay}ms` }} />
    ))}
  </div>
);

const Field = ({
  label, as, ...props
}: { label: string; as?: "textarea" } & React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>) => {
  const inputStyle = { border: "1px solid var(--border)", backgroundColor: "var(--card)" };
  return (
    <div>
      <label htmlFor={props.name} className="block text-sm font-medium">{label}</label>
      {as === "textarea" ? (
        <textarea id={props.name} rows={3} className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none" style={inputStyle} {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input id={props.name} className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none" style={inputStyle} {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </div>
  );
};
