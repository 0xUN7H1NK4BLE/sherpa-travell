"use client";

import { useState } from "react";
import Link from "next/link";
import MapLoader from "@/components/map/MapLoader";
import type { Trek } from "@/data/treks";
import { cn, formatAltitude } from "@/lib/utils";

export default function MapExplorer({ treks }: { treks: Trek[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="order-2 space-y-2.5 lg:order-1 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-2">
        {treks.map((trek) => (
          <div
            key={trek.slug}
            className={cn(
              "rounded-xl border p-4 transition-colors duration-200",
              active === trek.slug
                ? "border-saffron/60 bg-night-overlay"
                : "border-line bg-night-raised hover:border-line-strong",
            )}
          >
            <button
              type="button"
              onClick={() => setActive(trek.slug)}
              onMouseEnter={() => setActive(trek.slug)}
              className="w-full text-left"
            >
              <p className="text-[10px] font-medium uppercase tracking-eyebrow text-saffron">
                {trek.region}
              </p>
              <p className="mt-1 font-display text-xl font-light tracking-tight">
                {trek.name}
              </p>
              <p className="mt-1 text-xs text-mist">
                {trek.durationDays} days · {formatAltitude(trek.maxAltitudeM)} ·{" "}
                {trek.difficulty}
              </p>
            </button>
            <Link
              href={`/treks/${trek.slug}`}
              className="mt-2.5 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-saffron underline-offset-4 hover:underline"
            >
              View trek →
            </Link>
          </div>
        ))}
      </aside>
      <div className="order-1 h-[52vh] lg:order-2 lg:h-[72vh] lg:sticky lg:top-26">
        <MapLoader treks={treks} activeSlug={active} onSelect={setActive} />
      </div>
    </div>
  );
}
