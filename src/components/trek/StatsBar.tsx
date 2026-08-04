import type { Trek } from "@/data/treks";
import { formatAltitude } from "@/lib/utils";

export default function StatsBar({ trek }: { trek: Trek }) {
  const stats = [
    { label: "Duration", value: `${trek.durationDays} days` },
    { label: "Max altitude", value: formatAltitude(trek.maxAltitudeM), accent: true },
    { label: "Difficulty", value: trek.difficulty },
    { label: "Best season", value: trek.bestSeason.join(" · ") },
    { label: "Group size", value: trek.groupSize },
  ];

  return (
    <div className="border-y border-line bg-night-raised">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 py-7 md:px-8">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-mist">
              {stat.label}
            </dt>
            <dd
              className={`mt-2 font-display text-xl font-light tracking-tight md:text-2xl ${
                stat.accent ? "text-ice" : "text-snow"
              }`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
