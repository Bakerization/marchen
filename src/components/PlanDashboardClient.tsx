"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlanSection } from "@/lib/event-plan";

export const PlanDashboardClient = ({
  eventId,
  initialTab,
  sections,
  completedSections,
  totalSections,
  completedTasks,
  totalTasks,
}: {
  eventId: string;
  initialTab?: string;
  sections: PlanSection[];
  completedSections: number;
  totalSections: number;
  completedTasks: number;
  totalTasks: number;
}) => {
  const pending = useMemo(() => sections.filter((section) => !section.completed), [sections]);
  const completed = useMemo(() => sections.filter((section) => section.completed), [sections]);

  const firstTab = pending[0]?.id ?? sections[0]?.id ?? "";
  const validInitialTab = sections.some((section) => section.id === initialTab) ? initialTab : undefined;
  const [activeTab, setActiveTab] = useState<string>(validInitialTab ?? firstTab);
  const activeSection = sections.find((section) => section.id === activeTab) ?? sections[0];

  if (!activeSection) return null;

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>全体進捗</p>
        <p className="text-xl font-bold">
          大枠 {completedSections}/{totalSections} 完了
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          ジョブ {completedTasks}/{totalTasks} 完了
        </p>
      </div>

      <SectionCardGroup title="未完了" sections={pending} activeTab={activeTab} onSelect={setActiveTab} />
      <SectionCardGroup title="完了済み" sections={completed} activeTab={activeTab} onSelect={setActiveTab} />

      <div
        className="rounded-xl p-4"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-xs" style={{ color: "var(--muted)" }}>子ヘッダー</p>
        <h2 className="text-xl font-bold">{activeSection.title}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {activeSection.description}
        </p>
        <p className="mt-2 text-sm">
          進捗: {activeSection.doneCount}/{activeSection.totalCount} 完了
        </p>
      </div>

      <div className="space-y-3">
        {activeSection.tasks.map((task, idx) => (
          <div
            key={task.id}
            className="rounded-xl p-4"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {idx + 1}. {task.title}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {task.description}
                </p>
              </div>
              <input type="checkbox" checked={task.done} readOnly className="h-5 w-5 accent-orange-500" />
            </div>
            <Link
              href={task.href}
              className="mt-3 inline-block rounded-md px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              このジョブを開く
            </Link>
          </div>
        ))}
      </div>

      <Link
        href={`/organizer/events/${eventId}/applications`}
        className="inline-block text-sm underline"
        style={{ color: "var(--accent)" }}
      >
        ← イベント管理メインに戻る
      </Link>
    </div>
  );
};

const SectionCardGroup = ({
  title,
  sections,
  activeTab,
  onSelect,
}: {
  title: string;
  sections: PlanSection[];
  activeTab: string;
  onSelect: (id: string) => void;
}) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">{title}</h2>
    {sections.length === 0 ? (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        ありません
      </p>
    ) : (
      sections.map((section) => {
        const active = section.id === activeTab;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className="w-full rounded-xl p-4 text-left transition"
            style={{
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              backgroundColor: active ? "var(--accent-light)" : "var(--card)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{section.title}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {section.description}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {section.doneCount}/{section.totalCount} 完了
                </p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: section.completed ? "var(--success-light)" : "var(--warning-light)",
                  color: section.completed ? "var(--success)" : "var(--warning)",
                }}
              >
                {section.completed ? "完了" : "進行中"}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {section.tasks.map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={task.done} readOnly className="h-4 w-4 accent-orange-500" />
                  <span style={{ color: task.done ? "var(--foreground)" : "var(--muted)" }}>{task.title}</span>
                </label>
              ))}
            </div>
          </button>
        );
      })
    )}
  </section>
);
