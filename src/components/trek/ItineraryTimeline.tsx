import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import type { DayKind, ItineraryDay } from "@/data/treks";
import { cn, formatAltitude } from "@/lib/utils";

const kindStyles: Record<DayKind, { node: string; label: string }> = {
  travel: { node: "border-mist/50", label: "Travel" },
  trek: { node: "border-snow/70", label: "Trek" },
  acclimatization: { node: "border-ice", label: "Acclimatization" },
  summit: { node: "border-saffron bg-saffron", label: "High point" },
};

export default function ItineraryTimeline({
  itinerary,
}: {
  itinerary: ItineraryDay[];
}) {
  return (
    <ol className="relative ml-3 space-y-10 border-l border-white/10">
      {itinerary.map((day, i) => {
        const kind = kindStyles[day.kind];
        return (
          <li key={day.day} className="relative pl-9 md:pl-12">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[7px] top-2 h-3.5 w-3.5 rounded-full border-2 bg-night",
                kind.node,
              )}
            />
            <Reveal delay={Math.min(i * 0.03, 0.3)}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-display text-sm text-saffron">
                  Day {String(day.day).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-mist">
                  {kind.label}
                </span>
                <Badge variant="ice">{formatAltitude(day.altitudeM)}</Badge>
              </div>
              <h3 className="mt-2.5 font-display text-2xl font-light tracking-tight">
                {day.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
                {day.description}
              </p>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
