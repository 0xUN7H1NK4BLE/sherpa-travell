import type { Metadata } from "next";
import MapExplorer from "@/components/map/MapExplorer";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { treks } from "@/data/treks";

export const metadata: Metadata = {
  title: "Trek map",
  description:
    "Every Sherpa Treks Nepal route on the map — Kanchenjunga in the east to the Limi Valley in the far west. Click a marker to explore the trek.",
};

export default function MapPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32 pb-24 md:px-8 md:pt-40 md:pb-32">
      <Reveal className="mb-12">
        <SectionHeading
          eyebrow="The map"
          title="One country, eight worlds."
          description="Hover the list or tap a marker — each point is a region we guide in. The terrain layer shows exactly why these treks are special."
        />
      </Reveal>
      <MapExplorer treks={treks} />
    </div>
  );
}
