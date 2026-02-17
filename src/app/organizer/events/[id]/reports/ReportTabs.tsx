"use client";

import { useState } from "react";
import {
  generateAccountingReport,
  generateActivityReport,
} from "@/app/actions/report-generator";

interface ReportTabsProps {
  eventId: string;
}

export const ReportTabs = ({ eventId }: ReportTabsProps) => {
  const [tab, setTab] = useState<"accounting" | "activity">("accounting");
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const result =
        tab === "accounting"
          ? await generateAccountingReport(eventId)
          : await generateActivityReport(eventId);
      setReport(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab}_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab("accounting");
            setReport(null);
          }}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            tab === "accounting"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          会計報告
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("activity");
            setReport(null);
          }}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            tab === "activity"
              ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          活動報告
        </button>
      </div>

      <button
        type="button"
        onClick={generateReport}
        disabled={isLoading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isLoading
          ? "生成中..."
          : `${tab === "accounting" ? "会計" : "活動"}報告書を生成`}
      </button>

      {report && (
        <div className="space-y-3">
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {copied ? "コピーしました!" : "コピー"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              ダウンロード
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
              {report}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
