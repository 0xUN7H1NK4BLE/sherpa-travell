import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import TrekFinder from "@/components/treks/TrekFinder";
import { treks } from "@/data/treks";

export const metadata: Metadata = {
  title: "Treks",
  description:
    "Eight Sherpa-guided treks across Nepal — from Everest Base Camp to Upper Dolpo and the Limi Valley. Filter by region, difficulty and duration.",
};

export default function TreksPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32 pb-24 md:px-8 md:pt-40 md:pb-32">
      <Reveal className="mb-14">
        <SectionHeading
          eyebrow="All treks"
          title="Choose your level of wild."
          description="From week-long valley walks to three-week expeditions behind the Himalayan rain shadow. Filter by region, difficulty and time — every route is walked by our own crew."
        />
      </Reveal>
      <TrekFinder treks={treks} />
    </div>
  );
}
