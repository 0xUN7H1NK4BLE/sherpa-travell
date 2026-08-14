import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import Tilt from "@/components/ui/Tilt";

const values = [
  {
    number: "01",
    title: "Sherpa-born, mountain-raised",
    copy: "Abishek Sherpa grew up in these valleys. You get a guide who reads the weather, the trail and the mountains like family — because they are.",
  },
  {
    number: "02",
    title: "Remote-region specialists",
    copy: "Dolpo, Kanchenjunga, Limi Valley — restricted permits, camping logistics and flights are all handled for you, end to end.",
  },
  {
    number: "03",
    title: "Small groups, real flexibility",
    copy: "Groups of 2–10, never more. Itineraries flex around your pace, your acclimatization and your curiosity — not a bus schedule.",
  },
  {
    number: "04",
    title: "Safety at altitude, first",
    copy: "Acclimatization days are built in, never skipped. Conservative ascent profiles and honest go/no-go decisions, every time.",
  },
];

export default function WhyUs() {
  return (
    <section className="snap-page flex min-h-dvh flex-col justify-center border-y border-line bg-night-raised">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="Why Sherpa Treks Nepal"
            title="Not a booking agency. A mountain family."
            className="mb-14"
          />
        </Reveal>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <Reveal key={value.number} delay={i * 0.08} className="h-full">
              <Tilt max={5} depth={12} glareClassName="rounded-2xl" className="h-full">
                <div className="flex h-full flex-col gap-4 bg-night p-7">
                  <span className="font-display text-sm text-saffron">
                    {value.number}
                  </span>
                  <h3 className="font-display text-xl font-light tracking-tight">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-mist">{value.copy}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
