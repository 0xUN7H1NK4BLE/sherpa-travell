"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Badge from "@/components/ui/Badge";
import type { Trek } from "@/data/treks";
import { formatAltitude, formatCoordinates } from "@/lib/utils";

export default function StageHero({ trek }: { trek: Trek }) {
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const photoX = useTransform(sx, [-1, 1], [14, -14]);
  const contentX = useTransform(sx, [-1, 1], [-8, 8]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
  };

  const words = trek.name.split(" ");
  const last = words.pop() ?? "";

  const quickFacts: [string, string][] = [
    [`${trek.durationDays} days`, "door to door"],
    [formatAltitude(trek.maxAltitudeM), "high point"],
    [trek.groupSize, "trekkers per group"],
    [trek.bestSeason.join(" · "), "best season"],
    [trek.difficulty, "difficulty"],
  ];

  return (
    <section
      onPointerMove={handlePointerMove}
      className="photo-dark relative flex min-h-svh items-end overflow-hidden"
    >
      <motion.div
        style={reduce ? undefined : { x: photoX }}
        className="absolute inset-0"
        aria-hidden
      >
        <img
          src={trek.image}
          alt=""
          aria-hidden
          className="h-full w-full scale-110 object-cover"
        />
      </motion.div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-night/85 via-night/45 to-night"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-night/80 via-night/25 to-transparent"
        aria-hidden
      />

      <motion.div
        style={reduce ? undefined : { x: contentX }}
        className="relative mx-auto w-full max-w-7xl px-5 pt-28 pb-20 md:px-8 md:pb-28"
      >
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.85fr] lg:items-end lg:gap-16">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="mb-10 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mist"
            >
              <Link href="/treks" className="transition-colors hover:text-saffron">
                Treks
              </Link>
              <span aria-hidden>/</span>
              <span className="text-snow/70">{trek.region}</span>
            </nav>

            <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              {trek.region} · {formatCoordinates(trek.coordinates)}
            </p>

            <h1 className="max-w-5xl font-display text-5xl leading-[0.95] font-light tracking-tight text-balance sm:text-6xl md:text-8xl lg:text-9xl">
              {words.join(" ")}{" "}
              <em className="text-gradient not-italic">{last}</em>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-snow/80 md:text-xl">
              {trek.summary}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {trek.tags.map((tag) => (
                <Badge key={tag} variant="saffron">
                  {tag}
                </Badge>
              ))}
              <Badge>{trek.durationDays} days</Badge>
              <Badge variant="ice">{formatAltitude(trek.maxAltitudeM)}</Badge>
              <Badge variant="ice">{trek.difficulty}</Badge>
            </div>

            <a
              href="#journey"
              className="group mt-16 inline-flex flex-col items-start gap-3"
            >
              <span className="flex items-center gap-3 text-xs font-semibold uppercase tracking-eyebrow text-snow">
                Begin the ascent
                <span
                  className="block h-px w-12 bg-saffron transition-all duration-300 group-hover:w-20"
                  aria-hidden
                />
              </span>
              <span className="animate-bob block h-6 w-px bg-gradient-to-b from-saffron to-transparent" />
            </a>
          </div>

          <aside className="rounded-2xl border border-line bg-night-raised/85 p-6 backdrop-blur-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-saffron">
              At a glance
            </p>
            <ul className="mt-5 divide-y divide-line">
              {quickFacts.map(([strong, rest]) => (
                <li
                  key={rest}
                  className="flex items-baseline justify-between gap-6 py-3"
                >
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-mist">
                    {rest}
                  </span>
                  <span className="text-right font-display text-lg font-light tracking-tight text-snow">
                    {strong}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </motion.div>
    </section>
  );
}
