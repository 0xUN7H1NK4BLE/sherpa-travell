import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import MapLoader from "@/components/map/MapLoader";
import { getTreks } from "@/data/treks";

export default async function MapTeaser() {
  const treks = await getTreks();
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <Reveal>
          <SectionHeading
            eyebrow="Where we go"
            title="From Everest to the edge of Tibet."
            description="Eight regions across the length of Nepal — from the classic Khumbu to Dolpo's hidden valleys, where the trails see more snow leopards than tourists. Tap a marker to see what walks there."
          />
          <div className="mt-8">
            <Button href="/map" variant="ghost">
              Open the full map
            </Button>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="h-[380px] md:h-[460px]">
          <MapLoader treks={treks} />
        </Reveal>
      </div>
    </section>
  );
}
