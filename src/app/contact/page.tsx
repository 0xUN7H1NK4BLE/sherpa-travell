import type { Metadata } from "next";
import InquiryForm from "@/components/contact/InquiryForm";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { site } from "@/data/site";
import { getTreks } from "@/data/treks";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Plan your Nepal trek directly with Abishek Sherpa — WhatsApp, phone, or the inquiry form. Based in Kathmandu, replying usually the same day.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { trek } = await searchParams;
  const treks = await getTreks();
  const initialTrek =
    typeof trek === "string" && treks.some((t) => t.slug === trek)
      ? trek
      : undefined;

  const channels = [
    {
      label: "WhatsApp",
      value: site.contact.phoneDisplay,
      href: site.contact.whatsapp,
      note: "Fastest — usually answered within the hour",
    },
    {
      label: "Phone",
      value: site.contact.phoneDisplay,
      href: site.contact.phoneHref,
      note: "Direct line to Abishek",
    },
    {
      label: "Instagram",
      value: "@sherpaadventureandexpedition",
      href: site.contact.instagram,
      note: "Photos from every trek and expedition we've run",
    },
    {
      label: "Based in",
      value: site.contact.address,
      note: "Meet for tea and route planning before your trek",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-32 pb-24 md:px-8 md:pt-40 md:pb-32">
      <Reveal className="mb-14">
        <SectionHeading
          eyebrow="Contact"
          title="Talk to the person who'll walk with you."
          description={`No call centers, no middlemen. You plan directly with ${site.contact.name} — the guide who'll actually be on the trail with you.`}
        />
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <Reveal className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.label}
              className="rounded-2xl border border-line bg-night-raised p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-eyebrow text-saffron">
                {channel.label}
              </p>
              {channel.href ? (
                <a
                  href={channel.href}
                  target={channel.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    channel.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="mt-2 block font-display text-2xl font-light tracking-tight transition-colors hover:text-saffron"
                >
                  {channel.value}
                </a>
              ) : (
                <p className="mt-2 font-display text-2xl font-light tracking-tight">
                  {channel.value}
                </p>
              )}
              <p className="mt-1.5 text-sm text-mist">{channel.note}</p>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.12}>
          <InquiryForm initialTrek={initialTrek} treks={treks} />
        </Reveal>
      </div>
    </div>
  );
}
