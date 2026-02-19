"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import { sendMessage } from "@/app/actions/chat";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface ChatProps {
  threadId: string;
  initialMessages: Message[];
}

export const Chat = ({ threadId, initialMessages }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    // Optimistic update: add user message
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantMsg = await sendMessage(threadId, text);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsg.id,
          role: assistantMsg.role,
          content: assistantMsg.content,
          createdAt: assistantMsg.createdAt,
        },
      ]);
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "エラーが発生しました。もう一度お試しください。",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-12">
            <p className="text-lg font-medium">パンマルシェアシスタント</p>
            <p className="mt-2 text-sm">
              イベントの企画・運営をお手伝いします。何から始めますか？
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              }`}
            >
              {msg.role === "assistant" ? <MarkdownText text={msg.content} /> : msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              考え中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 dark:border-gray-800"
      >
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力...（Ctrl/Cmd + Enterで送信）"
            disabled={isLoading}
            rows={3}
            className="flex-1 resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
};

const MarkdownText = ({ text }: { text: string }) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`empty-${index}`} className="h-2" />;
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={`h3-${index}`} className="text-sm font-semibold">
              <InlineMarkdown text={trimmed.slice(4)} />
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={`h2-${index}`} className="text-base font-semibold">
              <InlineMarkdown text={trimmed.slice(3)} />
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={`h1-${index}`} className="text-base font-bold">
              <InlineMarkdown text={trimmed.slice(2)} />
            </h1>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <p key={`li-${index}`} className="flex gap-2">
              <span>•</span>
              <span><InlineMarkdown text={trimmed.slice(2)} /></span>
            </p>
          );
        }
        return (
          <p key={`p-${index}`}>
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
};

const InlineMarkdown = ({ text }: { text: string }) => {
  const chunks = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {chunks.map((chunk, i) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          return <strong key={`b-${i}`}>{chunk.slice(2, -2)}</strong>;
        }
        if (chunk.startsWith("`") && chunk.endsWith("`")) {
          return (
            <code key={`c-${i}`} className="rounded px-1" style={{ backgroundColor: "var(--accent-light)" }}>
              {chunk.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={`t-${i}`}>{chunk}</Fragment>;
      })}
    </>
  );
};
