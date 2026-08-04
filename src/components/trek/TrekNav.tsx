import Link from "next/link";
import type { Trek } from "@/data/treks";
import { formatAltitude } from "@/lib/utils";

function TrekCard({
  trek,
  label,
  arrow,
}: {
  trek: Trek;
  label: string;
  arrow: "←" | "→";
}) {
  return (
    <Link
      href={`/treks/${trek.slug}`}
      className="group photo-dark relative flex min-h-[190px] items-end overflow-hidden rounded-2xl border border-line p-6 md:p-8"
    >
      <img
        src={trek.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/10"
        aria-hidden
      />
      <div className="relative flex w-full items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-saffron">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-light tracking-tight text-balance md:text-3xl">
            {trek.name}
          </p>
          <p className="mt-1.5 text-xs text-snow/70">
            {trek.durationDays} days · {formatAltitude(trek.maxAltitudeM)} ·{" "}
            {trek.difficulty}
          </p>
        </div>
        <span
          className="shrink-0 text-2xl text-saffron transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        >
          {arrow}
        </span>
      </div>
    </Link>
  );
}

export default function TrekNav({ trek, all }: { trek: Trek; all: Trek[] }) {
  const idx = all.findIndex((t) => t.slug === trek.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div
      className={`grid gap-5 ${prev && next ? "sm:grid-cols-2" : ""}`}
    >
      {prev && <TrekCard trek={prev} label="Previous trek" arrow="←" />}
      {next && <TrekCard trek={next} label="Next trek" arrow="→" />}
    </div>
  );
}
