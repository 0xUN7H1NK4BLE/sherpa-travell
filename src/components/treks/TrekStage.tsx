"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import type { RouteContent } from "@/lib/routeContent";
import { formatAltitude, formatCoordinates, toRoman } from "@/lib/utils";

function AccentedName({ name }: { name: string }) {
  const words = name.split(" ");
  const last = words.pop() ?? "";
  return (
    <>
      {words.join(" ")}{" "}
      <em className="text-gradient italic">{last}</em>
    </>
  );
}

export default function TrekStage({
  trek,
  index,
  total,
  basePath = "/treks",
  itemLabel = "Trek",
  ctaLabel = "Explore this trek",
}: {
  trek: RouteContent;
  index: number;
  total: number;
  basePath?: string;
  itemLabel?: string;
  ctaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const quickFacts: [string, string][] = [
    [`${trek.durationDays} days`, "door to door"],
    [formatAltitude(trek.maxAltitudeM), "at the high point"],
    [trek.groupSize, "trekkers per group"],
  ];

  const fieldData: [string, string][] = [
    ["Difficulty", trek.difficulty],
    ["Best season", trek.bestSeason.join(" · ")],
    ["Group size", `${trek.groupSize} trekkers`],
    [
      "Permits",
      trek.tags.includes("restricted")
        ? "Restricted-area permit — arranged for you"
        : "Park & conservation permits — arranged for you",
    ],
    ["Coordinates", formatCoordinates(trek.coordinates)],
  ];

  return (
    <article
      ref={ref}
      className="relative flex min-h-[100svh] snap-start items-end overflow-hidden"
    >
      <motion.div className="absolute inset-0" aria-hidden>
        <motion.img
          style={{ y: bgY }}
          src={trek.image}
          alt=""
          className="h-full w-full scale-[1.2] object-cover"
        />
      </motion.div>
      <div
        className="absolute inset-0 bg-gradient-to-t from-night via-night/85 to-night/0"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-night via-night/55 to-transparent"
        aria-hidden
      />

      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 select-none font-display text-[22vw] leading-none text-snow/[0.07] lg:text-[16vw]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="absolute right-5 top-6 z-10 flex items-center gap-3 md:right-8">
        <span className="rounded-full border border-line bg-night/40 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-snow/70 backdrop-blur-sm">
          {itemLabel} {toRoman(index + 1)} / {toRoman(total)}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-24 md:px-8 md:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-8 bg-saffron" aria-hidden />
              {trek.region} · {formatAltitude(trek.maxAltitudeM)}
            </p>

            <h2 className="font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl lg:text-8xl">
              <AccentedName name={trek.name} />
            </h2>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-snow/80 md:text-lg">
              {trek.summary}
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {quickFacts.map(([strong, rest]) => (
                <li
                  key={rest}
                  className="flex items-baseline gap-2.5 text-sm text-snow/85"
                >
                  <span
                    className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-saffron"
                    aria-hidden
                  />
                  <span>
                    <strong className="font-semibold text-saffron">
                      {strong}
                    </strong>{" "}
                    {rest}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button href={`${basePath}/${trek.slug}`} size="lg">
                {ctaLabel}
                <span aria-hidden>→</span>
              </Button>
            </div>
          </div>

          <aside className="rounded-2xl border border-line bg-night-raised/85 p-6 backdrop-blur-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-saffron">
              Expedition facts
            </p>
            <dl className="mt-5">
              {fieldData.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-0"
                >
                  <dt className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-mist">
                    {label}
                  </dt>
                  <dd className="text-right text-sm text-snow/90">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <div
          className="pointer-events-none mt-14 hidden items-center gap-3 md:flex"
          aria-hidden
        >
          <span className="text-[10px] uppercase tracking-eyebrow text-mist">
            Scroll
          </span>
          <span className="animate-bob block h-6 w-px bg-gradient-to-b from-saffron to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-mist">
            {toRoman(index + 1)} of {toRoman(total)}
          </span>
        </div>
      </div>
    </article>
  );
}
