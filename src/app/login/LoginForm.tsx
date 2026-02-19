"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_USERS = [
  {
    label: "主催者",
    email: "organizer@marchen.local",
    password: "password123",
    description: "マルシェを企画・運営する自治体担当者",
  },
  {
    label: "出店者1",
    email: "vendor1@marchen.local",
    password: "password123",
    description: "パン屋「Sato's Kitchen」",
  },
  {
    label: "出店者2",
    email: "vendor2@marchen.local",
    password: "password123",
    description: "「Hana Crafts」",
  },
  {
    label: "管理者",
    email: "admin@marchen.local",
    password: "password123",
    description: "全権限を持つ管理者",
  },
] as const;

export const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">デモユーザーを選択（今だけ）</p>
        <div className="grid gap-2">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => {
                setEmail(user.email);
                setPassword(user.password);
                setError(null);
              }}
              className="rounded-md px-3 py-2 text-left text-sm"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--accent-light)" }}
            >
              <p className="font-medium" style={{ color: "var(--accent)" }}>{user.label}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{user.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium"
        >
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium"
        >
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
};
