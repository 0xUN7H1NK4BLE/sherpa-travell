import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import ExpeditionFinder from "@/components/expedition/ExpeditionFinder";
import Marquee from "@/components/ui/Marquee";
import { expeditions } from "@/data/expeditions";
import { formatAltitude } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Expeditions",
  description:
    "Sherpa-guided peak expeditions across Nepal — from Island Peak's glacier walk to the technical ridges of Ama Dablam and remote Mt Himlung.",
};

export default function ExpeditionsPage() {
  const regions = new Set(
    expeditions.flatMap((e) => e.region.split(",").map((r) => r.trim())),
  );
  const maxAlt = Math.max(...expeditions.map((e) => e.peakHeightM));
  const stats = [
    { value: String(expeditions.length), label: "expeditions" },
    { value: String(regions.size), label: "regions" },
    { value: formatAltitude(maxAlt), label: "highest summit" },
  ];

  return (
    <>
      <section className="photo-dark relative overflow-hidden border-b border-line">
        <img
          src="/images/scenes/glacier.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="photo-scrim-v absolute inset-0"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-5 pt-36 pb-16 md:px-8 md:pt-44 md:pb-20">
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              All {expeditions.length} expeditions
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl lg:text-8xl">
              Climb where the air runs{" "}
              <em className="text-gradient not-italic">thin.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-snow/80 md:text-lg">
              Guided peak climbs from trekking-peak first summits to
              technical 7,000m objectives. Filter by region, difficulty
              and time.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <span className="font-display text-3xl font-light text-saffron md:text-4xl">
                    {stat.value}
                  </span>
                  <span className="ml-3 text-xs uppercase tracking-[0.18em] text-mist">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <Marquee />
      <ExpeditionFinder expeditions={expeditions} />
    </>
  );
}
