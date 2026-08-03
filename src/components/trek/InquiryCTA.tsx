import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { site, waLink } from "@/data/site";
import type { Trek } from "@/data/treks";

export default function InquiryCTA({ trek }: { trek: Trek }) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-saffron/30 bg-night-raised p-8 md:p-12">
        <div
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-saffron/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-eyebrow text-saffron">
              Walk this route
            </p>
            <h2 className="font-display text-3xl font-light tracking-tight md:text-4xl">
              {trek.name}, {trek.durationDays} days — shaped around you.
            </h2>
            <p className="text-sm leading-relaxed text-mist">
              Permits, flights, crew and every cup of tea along the way, handled
              by {site.contact.name}. Tell us your dates and we&apos;ll send a
              full quote within a day.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              href={waLink(
                `Hi Abishek! I'm interested in the ${trek.name} trek (${trek.durationDays} days). Can you send me details and a quote?`,
              )}
              size="lg"
              external
            >
              WhatsApp about this trek
            </Button>
            <Button href={`/contact?trek=${trek.slug}`} variant="ghost" size="lg">
              Send an inquiry
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
