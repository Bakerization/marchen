"use client";

import { useRef, useState } from "react";

export const FilePickerButton = ({
  name,
  accept,
  required,
}: {
  name: string;
  accept?: string;
  required?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-75"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
      >
        {/* Upload icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        画像を選択
      </button>
      <span
        className="truncate text-xs"
        style={{ color: fileName ? "inherit" : "var(--muted)", maxWidth: 120 }}
        title={fileName ?? undefined}
      >
        {fileName ?? "未選択"}
      </span>
    </div>
  );
};
