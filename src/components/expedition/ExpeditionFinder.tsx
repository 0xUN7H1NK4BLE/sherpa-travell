"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import TrekStage from "@/components/treks/TrekStage";
import type { Difficulty, Expedition } from "@/data/expeditions";
import { waLink } from "@/data/site";
import { cn } from "@/lib/utils";

const durationFilters = [
  { id: "any", label: "Any length", test: () => true },
  { id: "week", label: "Up to 7 days", test: (d: number) => d <= 7 },
  { id: "classic", label: "8–10 days", test: (d: number) => d >= 8 && d <= 10 },
  { id: "epic", label: "10+ days", test: (d: number) => d > 10 },
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
        "rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-wide whitespace-nowrap transition-colors duration-200",
        active
          ? "border-saffron bg-saffron text-night"
          : "border-line text-mist hover:border-line-strong hover:text-snow",
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:gap-2.5">
      <span className="flex items-center gap-2.5">
        <span className="hidden text-[10px] uppercase tracking-[0.18em] text-mist/70 xl:inline">
          {label}
        </span>
        <span className="h-px w-6 bg-saffron/40 xl:hidden" aria-hidden />
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:flex-wrap xl:overflow-visible xl:pb-0">
        {children}
      </div>
    </div>
  );
}

export default function ExpeditionFinder({ expeditions }: { expeditions: Expedition[] }) {
  const regions = useMemo(() => [...new Set(expeditions.map((e) => e.region))], [expeditions]);
  const difficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [duration, setDuration] = useState("any");
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 4) {
        setHidden(delta > 0 && y > 120);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasFilters =
    activeRegions.length > 0 || difficulty !== null || duration !== "any";

  const filtered = useMemo(() => {
    const durationTest =
      durationFilters.find((f) => f.id === duration)?.test ??
      durationFilters[0].test;
    return expeditions.filter((expedition) => {
      if (
        activeRegions.length > 0 &&
        !activeRegions.some((r) => expedition.region.includes(r))
      ) {
        return false;
      }
      if (difficulty && expedition.difficulty !== difficulty) return false;
      if (!durationTest(expedition.durationDays)) return false;
      return true;
    });
  }, [expeditions, activeRegions, difficulty, duration]);

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
    <div>
      <div
        className={cn(
          "sticky top-16 z-40 border-y border-line bg-night/85 backdrop-blur-md transition-transform duration-300 md:top-26",
          hidden && "-translate-y-[calc(100%+1px)]",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-x-8 gap-y-3 px-5 py-3.5 md:px-8 xl:flex-row xl:flex-wrap xl:items-center">
          <FilterGroup label="Region">
            {regions.map((region) => (
              <Chip
                key={region}
                active={activeRegions.includes(region)}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Difficulty">
            {difficulties.map((d) => (
              <Chip
                key={d}
                active={difficulty === d}
                onClick={() => setDifficulty((prev) => (prev === d ? null : d))}
              >
                {d}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Duration">
            {durationFilters.map((f) => (
              <Chip
                key={f.id}
                active={duration === f.id}
                onClick={() => setDuration(f.id)}
              >
                {f.label}
              </Chip>
            ))}
          </FilterGroup>

          <div className="ml-auto flex items-center gap-4">
            <span
              className="text-[11px] text-mist"
              role="status"
              aria-live="polite"
            >
              {filtered.length} of {expeditions.length}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] text-saffron underline underline-offset-4 transition-colors hover:text-snow"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8">
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-3xl font-light">
              No expedition matches that combination.
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-mist">
              That usually means a custom climb. Tell Abishek what peak
              you&apos;re dreaming of — he&apos;s probably guided it.
            </p>
            <Button
              href={waLink(
                "Hi Abishek! I'm looking for a peak expedition that isn't listed on the site. Can we design a custom climb?",
              )}
              external
            >
              Ask for a custom climb
            </Button>
          </div>
        </div>
      ) : (
        <div className="snap-y snap-proximity">
          {filtered.map((expedition) => (
            <TrekStage
              key={expedition.slug}
              trek={expedition}
              index={expeditions.indexOf(expedition)}
              total={filtered.length}
              basePath="/expeditions"
              itemLabel="Expedition"
              ctaLabel="Explore this expedition"
            />
          ))}
        </div>
      )}
    </div>
  );
}
