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
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { getExpedition, getExpeditions } from "@/data/expeditions";

export async function generateStaticParams() {
  const expeditions = await getExpeditions();
  return expeditions.map((expedition) => ({ slug: expedition.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const expedition = await getExpedition(slug);
  if (!expedition) return {};
  return { title: expedition.name, description: expedition.summary };
}

export default async function ExpeditionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expedition = await getExpedition(slug);
  if (!expedition) notFound();
  const expeditions = await getExpeditions();

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
        <Reveal className="mb-12">
          <SectionHeading
            eyebrow="Expedition"
            title="What it takes to summit."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-3">
            {[
              ["Climbing grade", expedition.climbingGrade],
              ["Permit cost", `$${expedition.permitCostUSD}`],
              ["Technical gear", expedition.technicalGearRequired ? "Required" : "Not required"],
            ].map(([fieldLabel, value]) => (
              <div
                key={fieldLabel}
                className="flex items-baseline justify-between gap-6 border-b border-line py-3 sm:flex-col sm:items-start sm:gap-1.5"
              >
                <dt className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-mist">
                  {fieldLabel}
                </dt>
                <dd className="text-right text-sm text-snow/90 sm:text-left">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-snow/80 md:text-base">
            {expedition.summitSuccessNotes}
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="mb-14">
          <SectionHeading
            eyebrow="Scenes"
            title={`What a ${expedition.region.split(",")[0]} day looks like.`}
          />
        </Reveal>
        <Gallery images={expedition.gallery} name={expedition.name} />
      </section>

      <ReviewsSection subjectType="expedition" subjectSlug={expedition.slug} />

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
        <Reveal>
          <div className="mb-16">
            <SectionHeading
              eyebrow="More expeditions"
              title="Keep exploring."
              className="mb-10"
            />
            <TrekNav trek={expedition} all={expeditions} basePath="/expeditions" itemLabel="expedition" />
          </div>
        </Reveal>
        <InquiryCTA trek={expedition} />
      </section>
    </>
  );
}
