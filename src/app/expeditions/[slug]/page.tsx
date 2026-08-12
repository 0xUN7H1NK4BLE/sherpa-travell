import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ElevationProfile from "@/components/trek/ElevationProfile";
import Gallery from "@/components/trek/Gallery";
import InquiryCTA from "@/components/trek/InquiryCTA";
import StageHero from "@/components/trek/StageHero";
import StatsLedger from "@/components/trek/StatsLedger";
import TrekNav from "@/components/trek/TrekNav";
import TrekStory from "@/components/trek/TrekStory";
import { getExpedition, expeditions } from "@/data/expeditions";

export function generateStaticParams() {
  return expeditions.map((expedition) => ({ slug: expedition.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const expedition = getExpedition(slug);
  if (!expedition) return {};
  return { title: expedition.name, description: expedition.summary };
}

export default async function ExpeditionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expedition = getExpedition(slug);
  if (!expedition) notFound();

  return (
    <>
      <StageHero trek={expedition} basePath="/expeditions" listLabel="Expeditions" />
      <TrekStory trek={expedition} />

      <section className="border-y border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="mb-12">
            <SectionHeading
              eyebrow="Elevation"
              title="How the days climb."
              description="Hover the profile to see each day — conservative ascent, acclimatization built in."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ElevationProfile itinerary={expedition.itinerary} />
          </Reveal>
        </div>
      </section>

      <StatsLedger trek={expedition} />

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="mb-14">
          <SectionHeading
            eyebrow="Scenes"
            title={`What a ${expedition.region.split(",")[0]} day looks like.`}
          />
        </Reveal>
        <Gallery images={expedition.gallery} name={expedition.name} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
        <Reveal>
          <div className="mb-16">
            <SectionHeading
              eyebrow="More expeditions"
              title="Keep exploring."
              className="mb-10"
            />
            <TrekNav trek={expedition} all={expeditions} basePath="/expeditions" />
          </div>
        </Reveal>
        <InquiryCTA trek={expedition} />
      </section>
    </>
  );
}
