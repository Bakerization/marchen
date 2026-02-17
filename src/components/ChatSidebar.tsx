"use client";

import { WORKFLOW_STEPS } from "@/lib/ai";

interface ChatSidebarProps {
  currentStep?: string;
}

export const ChatSidebar = ({ currentStep }: ChatSidebarProps) => {
  return (
    <div className="w-64 shrink-0 border-r border-gray-200 p-4 dark:border-gray-800">
      <h3 className="mb-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
        ワークフロー
      </h3>
      <ol className="space-y-2">
        {WORKFLOW_STEPS.map((step, i) => {
          const isActive = currentStep === step.id;
          return (
            <li key={step.id} className="flex items-start gap-2">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {i + 1}
              </span>
              <div>
                <p
                  className={`text-sm ${
                    isActive
                      ? "font-semibold text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
