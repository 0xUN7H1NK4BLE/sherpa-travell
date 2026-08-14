"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MapLoader from "@/components/map/MapLoader";
import type { MapRoute } from "@/components/map/NepalMap";
import type { Trek } from "@/data/treks";
import type { Expedition } from "@/data/expeditions";
import { cn, formatAltitude } from "@/lib/utils";

type ExplorerRoute = MapRoute & {
  durationDays: number;
  maxAltitudeM: number;
  difficulty: string;
};

function routeKey(r: MapRoute): string {
  return `${r.kind}:${r.slug}`;
}

export default function MapExplorer({
  treks,
  expeditions,
}: {
  treks: Trek[];
  expeditions: Expedition[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const routes: ExplorerRoute[] = useMemo(
    () => [
      ...treks.map((t) => ({ kind: "trek" as const, ...t })),
      ...expeditions.map((e) => ({ kind: "expedition" as const, ...e })),
    ],
    [treks, expeditions],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="order-2 max-h-[42vh] space-y-2.5 overflow-y-auto overscroll-contain lg:order-1 lg:max-h-[72vh] lg:pr-2">
        {routes.map((route) => {
          const k = routeKey(route);
          return (
            <div
              key={k}
              className={cn(
                "rounded-xl border p-4 transition-colors duration-200",
                active === k
                  ? "border-saffron/60 bg-night-overlay"
                  : "border-line bg-night-raised hover:border-line-strong",
              )}
            >
              <button
                type="button"
                onClick={() => setActive(k)}
                onMouseEnter={() => setActive(k)}
                className="w-full text-left"
              >
                <p className="text-[10px] font-medium uppercase tracking-eyebrow text-saffron">
                  {route.region}
                  {route.kind === "expedition" ? " · Expedition" : ""}
                </p>
                <p className="mt-1 font-display text-xl font-light tracking-tight">
                  {route.name}
                </p>
                <p className="mt-1 text-xs text-mist">
                  {route.durationDays} days · {formatAltitude(route.maxAltitudeM)} ·{" "}
                  {route.difficulty}
                </p>
              </button>
              <Link
                href={`/${route.kind === "trek" ? "treks" : "expeditions"}/${route.slug}`}
                className="mt-2.5 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-saffron underline-offset-4 hover:underline"
              >
                {route.kind === "trek" ? "View trek →" : "View expedition →"}
              </Link>
            </div>
          );
        })}
      </aside>
      <div className="order-1 h-[52vh] lg:order-2 lg:h-[72vh] lg:sticky lg:top-26">
        <MapLoader routes={routes} activeKey={active} onSelect={setActive} />
      </div>
    </div>
  );
}
