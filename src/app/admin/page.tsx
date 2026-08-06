"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TrekForm from "@/components/admin/TrekForm";
import GalleryAdmin from "@/components/admin/GalleryAdmin";
import type { Trek } from "@/data/treks";

type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; trek: Trek };

export default function AdminPage() {
  const router = useRouter();
  const [treks, setTreks] = useState<Trek[] | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/treks", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setTreks(data.treks);
    else setError(data.error ?? "Failed to load treks");
  }, []);

  useEffect(() => {
    fetch("/api/treks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) setTreks(data.treks);
        else setError((data && data.error) ?? "Failed to load treks");
      })
      .catch(() => setError("Failed to load treks"));
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function onDelete(trek: Trek) {
    if (!window.confirm(`Delete "${trek.name}"? This cannot be undone.`)) return;
    setDeleting(trek.slug);
    setError(null);
    try {
      const res = await fetch(`/api/treks/${trek.slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      await refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const saved = async () => {
    await refresh();
    setMode({ kind: "list" });
  };

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              Sherpa Treks Nepal
            </p>
            <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">
              Treks admin
            </h1>
            <p className="mt-3 text-sm text-mist">
              {treks ? `${treks.length} treks on the site` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode({ kind: "new" })}
              className="rounded-full bg-saffron px-5 py-2.5 text-sm font-medium text-night transition-colors hover:bg-snow"
            >
              + New trek
            </button>
            <button
              onClick={logout}
              className="text-xs text-mist underline underline-offset-4 hover:text-snow"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        {mode.kind === "new" && (
          <div className="mt-10">
            <TrekForm initial={null} onSaved={saved} onCancel={() => setMode({ kind: "list" })} />
          </div>
        )}

        {mode.kind === "edit" && (
          <div className="mt-10">
            <TrekForm
              initial={mode.trek}
              onSaved={saved}
              onCancel={() => setMode({ kind: "list" })}
            />
          </div>
        )}

        {mode.kind === "list" && (
          <div className="mt-10 grid grid-cols-1 gap-4">
            {treks === null ? (
              <p className="text-sm text-mist">Loading…</p>
            ) : (
              treks.map((trek) => (
                <div
                  key={trek.slug}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-night/40 p-4"
                >
                  <img
                    src={trek.image}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display text-lg font-light">
                      {trek.name}
                    </h2>
                    <p className="text-xs text-mist">
                      {trek.region} · {trek.durationDays} days · {trek.difficulty}
                    </p>
                    <p className="truncate text-xs text-mist/70">{trek.summary}</p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button
                      onClick={() => setMode({ kind: "edit", trek })}
                      className="text-xs text-saffron underline underline-offset-4 hover:text-snow"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void onDelete(trek)}
                      disabled={deleting === trek.slug}
                      className="text-xs text-red-400 underline underline-offset-4 hover:text-red-300 disabled:opacity-50"
                    >
                      {deleting === trek.slug ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {treks && <GalleryAdmin treks={treks} />}
      </div>
    </section>
  );
}
