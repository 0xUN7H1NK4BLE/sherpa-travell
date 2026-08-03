import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Trek } from "@/data/treks";
import { formatAltitude } from "@/lib/utils";

export default function TrekCard({ trek }: { trek: Trek }) {
  return (
    <Link
      href={`/treks/${trek.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-night-raised transition-colors duration-300 hover:border-saffron/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={trek.image}
          alt={trek.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-night/70 to-transparent"
          aria-hidden
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {trek.tags.map((tag) => (
            <Badge key={tag} variant="saffron" className="bg-night/70 backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <p className="text-[11px] font-medium uppercase tracking-eyebrow text-saffron">
          {trek.region}
        </p>
        <h3 className="font-display text-2xl font-light tracking-tight">
          {trek.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-mist">
          {trek.summary}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-xs text-mist">
          <span>{trek.durationDays} days</span>
          <span aria-hidden>·</span>
          <span>{formatAltitude(trek.maxAltitudeM)}</span>
          <span aria-hidden>·</span>
          <span className="text-saffron">{trek.difficulty}</span>
        </div>
      </div>
    </Link>
  );
}
