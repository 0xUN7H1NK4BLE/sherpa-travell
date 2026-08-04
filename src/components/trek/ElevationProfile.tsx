"use client";

import { useRef, useState } from "react";
import type { ItineraryDay } from "@/data/treks";

export default function ElevationProfile({
  itinerary,
}: {
  itinerary: ItineraryDay[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const n = itinerary.length;
  const W = Math.max(n * 56, 720);
  const H = 300;
  const PL = 58;
  const PR = 20;
  const PT = 34;
  const PB = 38;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const alts = itinerary.map((d) => d.altitudeM);
  const min = Math.floor(Math.min(...alts) / 1000) * 1000;
  const rawMax = Math.max(...alts);
  const max = Math.ceil(rawMax / 1000) * 1000;
  const range = max - min || 1;

  const x = (i: number) => PL + (i / (n - 1)) * innerW;
  const y = (a: number) => PT + (1 - (a - min) / range) * innerH;

  const points = itinerary.map((d, i) => ({
    x: x(i),
    y: y(d.altitudeM),
    day: d,
  }));

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - PB} L${x(0).toFixed(1)},${H - PB} Z`;

  const ticks = Array.from({ length: 4 }, (_, i) => min + (range / 3) * i);
  const dayStep = Math.ceil(n / 12);
  const peakIndex = alts.indexOf(rawMax);
  const peak = points[peakIndex];
  const hovered = hover !== null ? points[hover] : null;

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PL) / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="overflow-x-auto">
      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="relative min-w-[560px]"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Elevation profile, day 1 at ${itinerary[0].altitudeM} metres rising to a high point of ${rawMax} metres`}
        >
          <defs>
            <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PL}
                x2={W - PR}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--line)"
                strokeDasharray="3 5"
              />
              <text
                x={PL - 8}
                y={y(t) + 3}
                textAnchor="end"
                className="fill-mist"
                fontSize="10"
              >
                {Math.round(t).toLocaleString("en-US")}m
              </text>
            </g>
          ))}

          <path d={area} fill="url(#elev-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) =>
            i % dayStep === 0 ? (
              <text
                key={p.day.day}
                x={p.x}
                y={H - PB + 22}
                textAnchor="middle"
                className="fill-mist"
                fontSize="10"
              >
                D{p.day.day}
              </text>
            ) : null,
          )}

          <circle cx={peak.x} cy={peak.y} r="4.5" fill="var(--accent)" />
          <circle
            cx={peak.x}
            cy={peak.y}
            r="4.5"
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.4"
            strokeWidth="6"
          />
          <text
            x={peak.x}
            y={peak.y - 12}
            textAnchor="middle"
            className="fill-saffron"
            fontSize="11"
            fontWeight="600"
          >
            {rawMax.toLocaleString("en-US")} m
          </text>

          {hovered && (
            <g>
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={PT}
                y2={H - PB}
                stroke="var(--accent-ice)"
                strokeOpacity="0.5"
                strokeDasharray="4 4"
              />
              <circle cx={hovered.x} cy={hovered.y} r="5" fill="var(--accent-ice)" />
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-night-raised px-3 py-2 text-center shadow-xl"
            style={{
              left: `${(hovered.x / W) * 100}%`,
              top: `${(hovered.y / H) * 100 - 4}%`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ice">
              Day {hovered.day.day}
            </p>
            <p className="max-w-[160px] truncate text-xs text-snow">
              {hovered.day.title}
            </p>
            <p className="text-xs font-medium text-saffron">
              {hovered.day.altitudeM.toLocaleString("en-US")} m
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
