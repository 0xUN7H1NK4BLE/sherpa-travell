"use client";

import type { Trek } from "@/data/treks";

const difficultyColor: Record<string, string> = {
  Moderate: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  Challenging: "bg-saffron/15 text-saffron border-saffron/25",
  Strenuous: "bg-red-400/15 text-red-300 border-red-400/25",
};

export default function AdminOverview({
  treks,
  newInquiryCount,
  newReviewCount,
  expeditionCount,
  onNewTrek,
  onGallery,
}: {
  treks: Trek[] | null;
  newInquiryCount?: number;
  newReviewCount?: number;
  expeditionCount?: number;
  onNewTrek: () => void;
  onGallery: () => void;
}) {
  if (!treks) {
    return <p className="mt-6 text-sm text-mist">Loading…</p>;
  }

  const regions = [...new Set(treks.map((t) => t.region))].length;
  const totalDays = treks.reduce((sum, t) => sum + t.durationDays, 0);
  const highest = treks.reduce(
    (max, t) => (t.maxAltitudeM > max.maxAltitudeM ? t : max),
    treks[0],
  );
  const byDifficulty = treks.reduce(
    (acc, t) => {
      acc[t.difficulty] = (acc[t.difficulty] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const maxCount = Math.max(1, ...Object.values(byDifficulty));
  const byTag = treks.reduce(
    (acc, t) => {
      t.tags.forEach((tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>,
  );

  const stats = [
    ...(newInquiryCount !== undefined
      ? [{ label: "New inquiries", value: String(newInquiryCount) }]
      : []),
    ...(newReviewCount !== undefined
      ? [{ label: "Pending reviews", value: String(newReviewCount) }]
      : []),
    { label: "Treks", value: String(treks.length) },
    ...(expeditionCount !== undefined
      ? [{ label: "Expeditions", value: String(expeditionCount) }]
      : []),
    { label: "Regions", value: String(regions) },
    { label: "Trip days", value: String(totalDays) },
    {
      label: "Highest trek",
      value: `${highest?.maxAltitudeM?.toLocaleString() ?? "-"} m`,
      hint: highest?.name,
    },
  ];

  return (
    <div className="mt-10">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-night/40 p-5"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mist">
              {s.label}
            </p>
            <p className="mt-2 font-display text-3xl font-light tracking-tight text-snow">
              {s.value}
            </p>
            {s.hint && (
              <p className="mt-1 truncate text-xs text-mist/80">{s.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-night/40 p-5">
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-mist">
            Difficulty mix
          </h3>
          <div className="mt-4 flex flex-col gap-4">
            {(["Moderate", "Challenging", "Strenuous"] as const).map((d) => {
              const count = byDifficulty[d] ?? 0;
              return (
                <div key={d} className="flex items-center gap-3">
                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${difficultyColor[d]}`}
                  >
                    {d}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-night-overlay">
                    <div
                      className="h-full rounded-full bg-saffron/70"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-mist">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-night/40 p-5">
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-mist">
            Tags
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(byTag)
              .sort((a, b) => b[1] - a[1])
              .map(([tag, count]) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-[11px] font-medium text-mist"
                >
                  {tag}
                  <span className="tabular-nums text-snow/80">{count}</span>
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onNewTrek}
          className="rounded-full bg-saffron px-6 py-3 text-sm font-medium text-night transition-colors hover:bg-snow"
        >
          + New trek
        </button>
        <button
          onClick={onGallery}
          className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-snow transition-colors hover:border-saffron hover:text-saffron"
        >
          Manage gallery
        </button>
      </div>
    </div>
  );
}
