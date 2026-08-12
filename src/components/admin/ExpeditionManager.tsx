"use client";

import { useState } from "react";
import Link from "next/link";
import ExpeditionForm from "./ExpeditionForm";
import type { Expedition } from "@/data/expeditions";

const difficultyColor: Record<string, string> = {
  Moderate: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  Challenging: "bg-saffron/15 text-saffron border-saffron/25",
  Strenuous: "bg-red-400/15 text-red-300 border-red-400/25",
};

type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; expedition: Expedition };

export default function ExpeditionManager({
  expeditions,
  onDelete,
  deleting,
}: {
  expeditions: Expedition[] | null;
  onDelete: (expedition: Expedition) => void;
  deleting: string | null;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("All");

  const filtered = (expeditions ?? []).filter((e) => {
    const matchesQuery =
      !query ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.region.toLowerCase().includes(query.toLowerCase()) ||
      e.summary.toLowerCase().includes(query.toLowerCase());
    const matchesDifficulty =
      difficulty === "All" || e.difficulty === difficulty;
    return matchesQuery && matchesDifficulty;
  });

  const saved = () => setMode({ kind: "list" });

  if (mode.kind === "new" || mode.kind === "edit") {
    return (
      <div className="mt-10">
        <ExpeditionForm
          initial={mode.kind === "edit" ? mode.expedition : null}
          onSaved={saved}
          onCancel={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search expeditions or regions…"
              className="w-full rounded-full border border-line-strong bg-night py-2.5 pl-9 pr-4 text-sm text-snow outline-none transition-colors placeholder:text-mist/60 focus:border-saffron"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", "Moderate", "Challenging", "Strenuous"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  difficulty === d
                    ? "border-saffron bg-saffron text-night"
                    : "border-line-strong text-mist hover:text-snow"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setMode({ kind: "new" })}
          className="w-fit rounded-full bg-saffron px-5 py-2.5 text-sm font-medium text-night transition-colors hover:bg-snow"
        >
          + New expedition
        </button>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-mist">
        {expeditions === null
          ? "Loading expeditions…"
          : `${filtered.length} of ${expeditions.length} expeditions`}
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {expeditions === null ? (
          <p className="text-sm text-mist">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-xl font-light text-snow">No expeditions found</p>
            <p className="mt-2 text-sm text-mist">
              Try a different search or difficulty filter.
            </p>
          </div>
        ) : (
          filtered.map((expedition) => (
            <div
              key={expedition.slug}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-night/40 p-4 sm:flex-row sm:items-center"
            >
              <img
                src={expedition.image}
                alt={expedition.name}
                className="h-20 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-32"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-light tracking-tight">
                    {expedition.name}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${difficultyColor[expedition.difficulty]}`}
                  >
                    {expedition.difficulty}
                  </span>
                </div>
                <p className="mt-1 text-xs text-mist">
                  {expedition.region} · {expedition.durationDays} days ·{" "}
                  {expedition.peakHeightM.toLocaleString()} m peak
                </p>
                <p className="mt-1 truncate text-xs text-mist/70">{expedition.summary}</p>
                {expedition.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {expedition.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-mist"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <Link
                  href={`/expeditions/${expedition.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-snow transition-colors hover:border-saffron hover:text-saffron"
                >
                  View
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => setMode({ kind: "edit", expedition })}
                    className="rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-snow transition-colors hover:border-saffron hover:text-saffron"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(expedition)}
                    disabled={deleting === expedition.slug}
                    className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-medium text-red-300 transition-colors hover:border-red-400 hover:text-red-200 disabled:opacity-50"
                  >
                    {deleting === expedition.slug ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
