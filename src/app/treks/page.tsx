import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import TrekFinder from "@/components/treks/TrekFinder";
import Marquee from "@/components/ui/Marquee";
import { getTreks } from "@/data/treks";
import { formatAltitude } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Treks",
  description:
    "Eight Sherpa-guided treks across Nepal - from Everest Base Camp to Upper Dolpo and the Limi Valley. Filter by region, difficulty and duration.",
};

export default async function TreksPage() {
  const treks = await getTreks();
  const regions = new Set(
    treks.flatMap((t) => t.region.split(",").map((r) => r.trim())),
  );
  const maxAlt = Math.max(...treks.map((t) => t.maxAltitudeM));
  const stats = [
    { value: String(treks.length), label: "expeditions" },
    { value: String(regions.size), label: "regions" },
    { value: formatAltitude(maxAlt), label: "highest point" },
  ];

  return (
    <>
      <section className="photo-dark relative flex h-svh min-h-[640px] items-end overflow-hidden border-b border-line">
        <img
          src="/images/hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="photo-scrim-v absolute inset-0"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 md:px-8 md:pb-20">
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              All {treks.length} treks
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl lg:text-8xl">
              Choose your level of{" "}
              <em className="text-gradient not-italic">wild.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-snow/80 md:text-lg">
              Eight expeditions, told the way they feel on the trail. Scroll
              through them - or filter by region, difficulty and time.
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
      <TrekFinder treks={treks} />
    </>
  );
}
