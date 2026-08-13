import SectionHeading from "@/components/ui/SectionHeading";
import { dayKindLabel } from "@/data/treks";
import type { ItineraryDay } from "@/data/treks";
import type { RouteContent } from "@/lib/routeContent";
import { cn, formatAltitude, oxygenAt, totalAscent } from "@/lib/utils";

const kindBar: Record<ItineraryDay["kind"], string> = {
  travel: "bg-mist/60",
  trek: "bg-snow/70",
  acclimatization: "bg-ice/70",
  summit: "bg-saffron",
};

export default function StatsLedger({ trek }: { trek: RouteContent }) {
  const alts = trek.itinerary.map((d) => d.altitudeM);
  const min = Math.min(...alts);
  const max = Math.max(...alts);
  const ascent = totalAscent(trek.itinerary);
  const summitO2 = oxygenAt(max);
  const baseO2 = oxygenAt(min);
  const peakDay =
    trek.itinerary.findIndex((d) => d.altitudeM === max) + 1;

  const stats = [
    { label: "Days on the trail", value: String(trek.durationDays) },
    { label: "High point", value: formatAltitude(max) },
    { label: "Total climb", value: `${ascent.toLocaleString("en-US")} m` },
    { label: "Difficulty", value: trek.difficulty },
    { label: "Group size", value: trek.groupSize },
    { label: "Best season", value: trek.bestSeason.join(" · ") },
    { label: "Oxygen at the top", value: `${summitO2.toFixed(0)}%` },
    { label: "High-point day", value: `Day ${peakDay}` },
  ];

  return (
    <section className="border-y border-line bg-night-raised">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          eyebrow="The ledger"
          title="The climb, in numbers."
          description="Everything about this route, derived from the itinerary — from the metres you gain to the oxygen you'll be breathing at the top."
          className="mb-14"
        />

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 bg-night p-7">
              <span className="font-display text-4xl font-light text-saffron md:text-5xl">
                {stat.value}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-mist">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div className="space-y-5">
            <h3 className="font-display text-3xl font-light tracking-tight md:text-4xl">
              Thinner air, day by day.
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-mist md:text-base">
              Oxygen falls with altitude. You start at{" "}
              <span className="text-snow">
                {baseO2.toFixed(0)}% of sea level
              </span>{" "}
              and finish at{" "}
              <span className="text-ice">{summitO2.toFixed(0)}%</span> at the
              high point — which is why every ascent profile here is
              conservative, with rest days built in.
            </p>
            <ul className="space-y-2.5 text-sm text-mist">
              {trek.bestSeason.map((season) => (
                <li key={season} className="flex items-center gap-2.5">
                  <span
                    className="h-1 w-1 rounded-full bg-saffron"
                    aria-hidden
                  />
                  Best trekked {season}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex h-48 items-end gap-1.5">
              {trek.itinerary.map((day) => {
                const height = ((day.altitudeM - min) / (max - min || 1)) * 100;
                return (
                  <div
                    key={day.day}
                    title={`Day ${day.day}: ${formatAltitude(day.altitudeM)}`}
                    className={cn(
                      "flex-1 rounded-t transition-transform hover:-translate-y-0.5",
                      kindBar[day.kind],
                    )}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.18em] text-mist">
              {Object.entries(dayKindLabel).map(([kind, label]) => (
                <span key={kind} className="flex items-center gap-2">
                  <span
                    className={cn("h-2 w-2 rounded-full", kindBar[kind as ItineraryDay["kind"]])}
                    aria-hidden
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
