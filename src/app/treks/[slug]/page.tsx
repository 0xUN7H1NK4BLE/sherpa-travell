import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ElevationProfile from "@/components/trek/ElevationProfile";
import Gallery from "@/components/trek/Gallery";
import InquiryCTA from "@/components/trek/InquiryCTA";
import ItineraryTimeline from "@/components/trek/ItineraryTimeline";
import StatsBar from "@/components/trek/StatsBar";
import { getTrek, treks } from "@/data/treks";

export function generateStaticParams() {
  return treks.map((trek) => ({ slug: trek.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trek = getTrek(slug);
  if (!trek) return {};
  return { title: trek.name, description: trek.summary };
}

export default async function TrekPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trek = getTrek(slug);
  if (!trek) notFound();

  return (
    <>
      <section className="relative flex min-h-[68vh] items-end overflow-hidden">
        <img
          src={trek.image}
          alt={trek.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-night/75 via-night/25 to-night"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 pt-40 pb-16 md:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-mist"
          >
            <Link href="/treks" className="transition-colors hover:text-saffron">
              Treks
            </Link>
            <span aria-hidden>/</span>
            <span className="text-snow/80">{trek.region}</span>
          </nav>
          <h1 className="font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl">
            {trek.name}
          </h1>
          <div className="mt-6 flex flex-wrap gap-2">
            {trek.tags.map((tag) => (
              <Badge key={tag} variant="saffron" className="bg-night/60 backdrop-blur-sm">
                {tag}
              </Badge>
            ))}
            <Badge className="bg-night/60 backdrop-blur-sm">
              {trek.durationDays} days
            </Badge>
          </div>
        </div>
      </section>

      <StatsBar trek={trek} />

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
        <Reveal>
          <Eyebrow className="mb-6">The trek</Eyebrow>
          <p className="font-display text-2xl leading-snug font-light tracking-tight text-snow/90 md:text-3xl">
            {trek.summary}
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-eyebrow text-saffron">
            Highlights
          </h2>
          <ul className="space-y-3.5">
            {trek.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-mist">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" aria-hidden />
                {highlight}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="border-y border-white/10 bg-night-raised">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="mb-12">
            <SectionHeading
              eyebrow="Elevation"
              title="How the days climb."
              description="Hover the profile to see each day — conservative ascent, acclimatization built in."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ElevationProfile itinerary={trek.itinerary} />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="mb-14">
          <SectionHeading
            eyebrow="Day by day"
            title={`${trek.durationDays} days on the trail.`}
          />
        </Reveal>
        <ItineraryTimeline itinerary={trek.itinerary} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28">
        <Gallery images={trek.gallery} name={trek.name} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
        <InquiryCTA trek={trek} />
      </section>
    </>
  );
}
