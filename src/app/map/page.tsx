import type { Metadata } from "next";
import MapExplorer from "@/components/map/MapExplorer";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getTreks } from "@/data/treks";
import { getExpeditions } from "@/data/expeditions";

export const metadata: Metadata = {
  title: "Trek map",
  description:
    "Every Sherpa Treks Nepal route on the map - Kanchenjunga in the east to the Limi Valley in the far west. Click a marker to explore the trek.",
};

export default async function MapPage() {
  const [treks, expeditions] = await Promise.all([getTreks(), getExpeditions()]);
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32 pb-24 md:px-8 md:pt-40 md:pb-32">
      <Reveal className="mb-12">
        <SectionHeading
          eyebrow="The map"
          title="One country, eight worlds."
          description="Tap a place on the map or pick a trek or expedition in the list - each point is a region we guide in. The terrain layer shows exactly why these routes are special."
        />
      </Reveal>
      <MapExplorer treks={treks} expeditions={expeditions} />
    </div>
  );
}
