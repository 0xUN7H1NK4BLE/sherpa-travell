"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import TrekCard from "./TrekCard";
import { difficulties, regions, type Difficulty, type Trek } from "@/data/treks";
import { waLink } from "@/data/site";
import { cn } from "@/lib/utils";

const durationFilters = [
  { id: "any", label: "Any length", test: () => true },
  { id: "week", label: "Up to 7 days", test: (d: number) => d <= 7 },
  { id: "classic", label: "8–14 days", test: (d: number) => d >= 8 && d <= 14 },
  { id: "long", label: "15–20 days", test: (d: number) => d >= 15 && d <= 20 },
  { id: "epic", label: "20+ days", test: (d: number) => d > 20 },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200",
        active
          ? "border-saffron bg-saffron text-night"
          : "border-white/15 text-mist hover:border-white/40 hover:text-snow",
      )}
    >
      {children}
    </button>
  );
}

export default function TrekFinder({ treks }: { treks: Trek[] }) {
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [duration, setDuration] = useState("any");

  const hasFilters =
    activeRegions.length > 0 || difficulty !== null || duration !== "any";

  const filtered = useMemo(() => {
    const durationTest =
      durationFilters.find((f) => f.id === duration)?.test ??
      durationFilters[0].test;
    return treks.filter((trek) => {
      if (
        activeRegions.length > 0 &&
        !activeRegions.some((r) => trek.region.includes(r))
      ) {
        return false;
      }
      if (difficulty && trek.difficulty !== difficulty) return false;
      if (!durationTest(trek.durationDays)) return false;
      return true;
    });
  }, [treks, activeRegions, difficulty, duration]);

  const toggleRegion = (region: string) =>
    setActiveRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region],
    );

  const reset = () => {
    setActiveRegions([]);
    setDifficulty(null);
    setDuration("any");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-eyebrow text-saffron">
            Find your trek
          </h2>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-mist underline underline-offset-4 transition-colors hover:text-snow"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-mist">
            Region
          </h3>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <Chip
                key={region}
                active={activeRegions.includes(region)}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-mist">
            Difficulty
          </h3>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <Chip
                key={d}
                active={difficulty === d}
                onClick={() => setDifficulty((prev) => (prev === d ? null : d))}
              >
                {d}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-mist">
            Duration
          </h3>
          <div className="flex flex-wrap gap-2">
            {durationFilters.map((f) => (
              <Chip
                key={f.id}
                active={duration === f.id}
                onClick={() => setDuration(f.id)}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        <p className="text-xs text-mist" role="status" aria-live="polite">
          {filtered.length} of {treks.length} treks
        </p>
      </aside>

      <div>
        {filtered.length === 0 ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="font-display text-3xl font-light">
              No trek matches that combination.
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-mist">
              That usually means a custom route. Tell Abishek what you&apos;re
              dreaming of — he&apos;s probably walked it.
            </p>
            <Button
              href={waLink(
                "Hi Abishek! I'm looking for a trek that isn't listed on the site. Can we design a custom route?",
              )}
              external
            >
              Ask for a custom route
            </Button>
          </div>
        ) : (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((trek) => (
                <motion.div
                  key={trek.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <TrekCard trek={trek} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
