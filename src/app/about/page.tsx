import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { site, waLink } from "@/data/site";
import { getRegions } from "@/data/treks";

export const metadata: Metadata = {
  title: "About",
  description:
    "Sherpa Treks Nepal is a Kathmandu-based trekking company founded by Abishek Sherpa, guiding the country's most remote and rewarding regions.",
};

export default async function AboutPage() {
  const regions = await getRegions();
  return (
    <>
      <section className="photo-dark relative overflow-hidden">
        <img
          src="/images/about.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/85 to-night"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-5 pt-32 pb-24 md:px-8 md:pt-52 md:pb-32">
          <Reveal>
            <Eyebrow className="mb-6">About us</Eyebrow>
            <h1 className="max-w-3xl font-display text-5xl leading-[1.02] font-light tracking-tight text-balance md:text-7xl">
              We don&apos;t sell tours. We walk you home.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-14 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
        <Reveal className="space-y-6 text-lg leading-relaxed text-snow/80">
          <p>
            {site.name} was founded in Kathmandu by{" "}
            <span className="text-saffron">{site.contact.name}</span> — a Sherpa
            guide who grew up with the Himalaya as his backyard, and who spent
            years watching trekkers get funnelled onto the same two crowded
            trails while the real Nepal sat empty.
          </p>
          <p>
            We exist for the other Nepal: the Kanchenjunga Conservation Area,
            where a day&apos;s walk passes more blue sheep than people. Upper
            and Lower Dolpo, behind the Dhaulagiri rain shadow, where Bon
            monasteries still run on butter-lamp light. The Limi Valley in
            Humla, at the very edge of Tibet. And yes — Sagarmatha, Langtang,
            Gosaikunda and Manaslu too, walked the way they deserve: slowly,
            safely, and with people who call them home.
          </p>
          <p>
            Every itinerary we run is one we&apos;ve walked ourselves. Every
            acclimatization day is there because altitude doesn&apos;t
            negotiate. And every trek is led or designed by Abishek personally.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="rounded-2xl border border-line bg-night-raised p-7">
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-saffron">
              Your guide
            </p>
            <p className="mt-3 font-display text-3xl font-light tracking-tight">
              {site.contact.name}
            </p>
            <p className="mt-1 text-sm text-mist">{site.contact.role}</p>
            <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mist">Based in</dt>
                <dd>{site.contact.address}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">Phone / WhatsApp</dt>
                <dd>
                  <a
                    href={site.contact.phoneHref}
                    className="transition-colors hover:text-saffron"
                  >
                    {site.contact.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">Replies</dt>
                <dd>Usually same day</dd>
              </div>
            </dl>
            <div className="mt-7">
              <Button
                href={waLink("Hi Abishek! I'd like to know more about you and your treks.")}
                external
                className="w-full"
              >
                Say hello
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-line bg-night-raised">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <Reveal>
            <SectionHeading
              eyebrow="Home ground"
              title="The regions we know by heart."
              className="mb-10"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-3">
              {regions.map((region) => (
                <Badge key={region} variant="ice" className="px-4 py-2 text-xs">
                  {region}
                </Badge>
              ))}
              <Badge variant="saffron" className="px-4 py-2 text-xs">
                + custom routes on request
              </Badge>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
