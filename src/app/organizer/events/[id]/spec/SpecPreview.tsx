"use client";

import { useState } from "react";

interface SpecPreviewProps {
  spec: string;
}

export const SpecPreview = ({ spec }: SpecPreviewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(spec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {copied ? "コピーしました!" : "クリップボードにコピー"}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
          {spec}
        </pre>
      </div>
    </div>
  );
};
