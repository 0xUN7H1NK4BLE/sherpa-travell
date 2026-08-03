import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { site, waLink } from "@/data/site";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-white/10">
      <img
        src="/images/scenes/stars.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-night via-night/70 to-night"
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-5 py-28 text-center md:py-36">
        <Reveal>
          <p className="mb-6 text-xs font-medium uppercase tracking-eyebrow text-saffron">
            {site.contact.name} is one message away
          </p>
          <h2 className="font-display text-5xl leading-[1.02] font-light tracking-tight text-balance md:text-7xl">
            The mountains don&apos;t wait.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-mist">
            Tell us when you can come and how far you want to go. We&apos;ll
            shape the trek around you — not the other way round.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/treks" size="lg">
              Find your trek
            </Button>
            <Button
              href={waLink(
                "Hi Abishek! I'm thinking about a trek in Nepal. Can you help me plan it?",
              )}
              variant="ghost"
              size="lg"
              external
            >
              WhatsApp {site.contact.phoneDisplay}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
