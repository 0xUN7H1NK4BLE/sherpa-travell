import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import Tilt from "@/components/ui/Tilt";
import { getFeaturedTreks } from "@/data/treks";
import { formatAltitude } from "@/lib/utils";

export default async function FeaturedTreks() {
  const featuredTreks = await getFeaturedTreks();
  return (
    <section className="snap-page mx-auto flex min-h-dvh max-w-7xl flex-col justify-center px-5 py-24 md:px-8 md:py-32">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <SectionHeading
            eyebrow="Featured expeditions"
            title="Treks most companies can't take you on."
            description="Restricted-area permits, remote logistics, decades of local relationships — this is our home ground."
          />
        </Reveal>
        <Reveal delay={0.15}>
          <Button href="/treks" variant="ghost">
            All 8 treks
          </Button>
        </Reveal>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {featuredTreks.map((trek, i) => (
          <Reveal key={trek.slug} delay={i * 0.08}>
            <Tilt max={6} depth={20}>
              <Link
                href={`/treks/${trek.slug}`}
                className="photo-dark group relative block overflow-hidden rounded-2xl border border-line transition-shadow duration-300 hover:shadow-[0_30px_70px_-24px_rgba(0,0,0,0.6)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
                  <img
                    src={trek.image}
                    alt={trek.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 md:p-8">
                  <p className="text-[11px] font-medium uppercase tracking-eyebrow text-saffron">
                    {trek.region}
                  </p>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <h3 className="font-display text-3xl font-light tracking-tight md:text-4xl">
                      {trek.name}
                    </h3>
                    <span
                      className="font-display text-2xl text-saffron transition-transform duration-500 group-hover:translate-x-1.5"
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{trek.durationDays} days</Badge>
                    <Badge variant="ice">{formatAltitude(trek.maxAltitudeM)}</Badge>
                    <Badge variant="saffron">{trek.difficulty}</Badge>
                  </div>
                </div>
              </Link>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
