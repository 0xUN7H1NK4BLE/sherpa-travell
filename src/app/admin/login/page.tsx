"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "@/components/ui/Reveal";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-24 md:px-8">
        <Reveal>
          <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron">
            <span className="h-px w-10 bg-saffron" aria-hidden />
            Sherpa Treks Nepal
          </p>
          <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">
            Admin sign in
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            Manage the treks on the site — add, edit, delete and upload photos.
          </p>
        </Reveal>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-mist">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="rounded-lg border border-line-strong bg-night px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-saffron"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-mist">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-lg border border-line-strong bg-night px-4 py-3 text-sm text-snow outline-none transition-colors focus:border-saffron"
            />
          </label>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-saffron px-6 py-3 text-sm font-medium text-night transition-all duration-300 hover:bg-snow disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}
