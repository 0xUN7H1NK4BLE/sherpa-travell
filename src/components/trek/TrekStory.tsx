"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useScroll } from "framer-motion";
import AccentedTitle from "@/components/ui/AccentedTitle";
import { dayKindLabel } from "@/data/treks";
import { dayPlaces } from "@/data/dayViews";
import type { ItineraryDay, Trek } from "@/data/treks";
import { cn, dayGain, formatAltitude, oxygenAt } from "@/lib/utils";
import { photoForTrek } from "@/data/trekPhotos";

const TrekCinema = dynamic(() => import("@/components/map/TrekCinema"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-night" />,
});

const RouteMap = dynamic(() => import("@/components/trek/RouteMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton h-full w-full" />,
});

const kindAccent: Record<ItineraryDay["kind"], string> = {
  travel: "text-mist",
  trek: "text-snow",
  acclimatization: "text-ice",
  summit: "text-saffron",
};

function AltitudeRail({ trek, active }: { trek: Trek; active: number }) {
  const alts = trek.itinerary.map((d) => d.altitudeM);
  const min = Math.min(...alts);
  const max = Math.max(...alts);
  const progress = active / (trek.itinerary.length - 1);
  const day = trek.itinerary[active];

  return (
    <aside
      className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
      aria-hidden
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
        {formatAltitude(max)}
      </span>
      <div className="relative h-56 w-px bg-line">
        <span
          className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-saffron bg-night shadow-[0_0_14px_rgba(245,158,11,0.8)] transition-all duration-700"
          style={{ top: `${(1 - progress) * 100}%` }}
        />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
        {formatAltitude(min)}
      </span>
      <span className="mt-1 rounded-full border border-line bg-night-raised px-2.5 py-1 text-center text-[10px] leading-tight font-medium text-ice">
        Day {day.day}
        <br />
        O₂ {oxygenAt(day.altitudeM).toFixed(0)}%
      </span>
    </aside>
  );
}

function StageDay({
  trek,
  day,
  index,
  total,
}: {
  trek: Trek;
  day: ItineraryDay;
  index: number;
  total: number;
}) {
  const gain = dayGain(trek.itinerary, index);
  const o2 = oxygenAt(day.altitudeM);
  const kind = dayKindLabel[day.kind];
  const toPeak = trek.maxAltitudeM - day.altitudeM;
  const photo = photoForTrek(trek.slug, index);

  const stats = [
    gain !== null && {
      strong: `+${gain.toLocaleString("en-US")} m`,
      rest: "gained today",
    },
    { strong: `O₂ ${o2.toFixed(0)}%`, rest: "of sea level" },
    { strong: `Day ${day.day}`, rest: `of ${total}` },
  ].filter(Boolean) as { strong: string; rest: string }[];

  const facts = [
    { label: "Altitude", value: formatAltitude(day.altitudeM) },
    { label: "Oxygen", value: `${o2.toFixed(0)}% of sea level` },
    gain !== null
      ? { label: "Gained today", value: `+${gain.toLocaleString("en-US")} m` }
      : null,
    { label: "Kind of day", value: kind },
    toPeak > 0
      ? {
          label: "To the high point",
          value: `${toPeak.toLocaleString("en-US")} m`,
        }
      : { label: "High point", value: formatAltitude(day.altitudeM) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="relative flex min-h-svh snap-start items-center overflow-hidden py-28">
      <div
        className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-night/15"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-night/80 via-night/25 to-transparent"
        aria-hidden
      />

      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-10 select-none font-display text-[26vw] leading-none text-snow/[0.06]"
      >
        {String(day.day).padStart(2, "0")}
      </span>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[1.6fr_1fr] lg:items-center lg:gap-20 lg:pr-[400px]">
        <div>
          <p
            className={cn(
              "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-eyebrow",
              kindAccent[day.kind],
            )}
          >
            <span className="h-px w-8 bg-current opacity-60" aria-hidden />
            Day {String(day.day).padStart(2, "0")} · {kind} ·{" "}
            {formatAltitude(day.altitudeM)}
          </p>
          <h2 className="max-w-3xl font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl">
            <AccentedTitle text={day.title} />
          </h2>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-snow/80 md:text-lg">
            {day.description}
          </p>
          <ul className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((stat) => (
              <li key={stat.rest} className="flex items-baseline gap-2.5 text-sm text-snow/85">
                <span
                  className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-saffron"
                  aria-hidden
                />
                <span>
                  <strong className="font-semibold text-saffron">
                    {stat.strong}
                  </strong>{" "}
                  {stat.rest}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {photo && (
            <figure className="photo-dark relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
              <img
                src={photo}
                alt={`${day.title} — ${formatAltitude(day.altitudeM)}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 to-transparent px-5 pt-12 pb-4 text-[10px] uppercase tracking-[0.18em] text-snow/70">
                {day.title}
              </figcaption>
            </figure>
          )}
          <aside className="rounded-2xl border border-line bg-night-raised/90 p-6 backdrop-blur-sm md:p-7">
          <p className="text-xs font-semibold uppercase tracking-eyebrow text-saffron">
            Field data
          </p>
          <dl className="mt-5">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-0"
              >
                <dt className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-mist">
                  {fact.label}
                </dt>
                <dd className="text-right font-display text-lg font-light tracking-tight text-snow">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-mist">
              <span>Journey</span>
              <span>
                {index + 1} / {total} · {Math.round(((index + 1) / total) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-saffron transition-all duration-700"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>
        </aside>
        </div>
      </div>
    </article>
  );
}

export default function TrekStory({ trek }: { trek: Trek }) {
  const [active, setActive] = useState(0);
  const [mapVisible, setMapVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const journeyRef = useRef<HTMLDivElement>(null);
  const total = trek.itinerary.length;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const el = journeyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMapVisible(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = refs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of refs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div id="journey" ref={journeyRef} className="relative">
      {mapVisible && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-80"
          aria-hidden
        >
          <TrekCinema trek={trek} progress={scrollYProgress} />
        </div>
      )}
      {mapVisible && isDesktop && (
        <aside className="fixed bottom-0 right-0 top-26 z-40 hidden w-[400px] flex-col border-l border-line bg-night-raised/90 backdrop-blur-md lg:flex">
          <div className="border-b border-line px-5 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-saffron">
                Route
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
                Day {String(trek.itinerary[active].day).padStart(2, "0")} /{" "}
                {total}
              </p>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-snow">
              {dayPlaces[trek.slug]?.[active]?.from ?? "—"}{" "}
              <span className="text-saffron">→</span>{" "}
              {dayPlaces[trek.slug]?.[active]?.to ?? "—"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-mist">
              street view · watch the walk
            </p>
          </div>
          <div className="relative min-h-0 flex-1">
            <RouteMap
              trek={trek}
              active={active}
              onSelect={(i) =>
                refs.current[i]?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
          <div className="border-t border-line px-5 py-3">
            <p className="truncate text-xs font-medium text-snow/90">
              {trek.itinerary[active].title}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-mist">
              {formatAltitude(trek.itinerary[active].altitudeM)}
            </p>
          </div>
        </aside>
      )}
      <div className="relative z-10 snap-y snap-proximity">
        <AltitudeRail trek={trek} active={active} />
        {trek.itinerary.map((day, i) => (
          <div
            key={day.day}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            <StageDay
              trek={trek}
              day={day}
              index={i}
              total={total}
            />
          </div>
        ))}
        <p className="px-5 pt-10 pb-16 text-center text-[11px] uppercase tracking-[0.18em] text-mist">
          Photos: Wikimedia Commons contributors · CC BY-SA
        </p>
      </div>
    </div>
  );
}
