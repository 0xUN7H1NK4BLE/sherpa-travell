"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GalleryCard from "@/components/gallery/GalleryCard";
import Lightbox from "@/components/gallery/Lightbox";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/data/gallery";

const PAGE = 12;

export default function GalleryWall({
  items,
  treks,
}: {
  items: GalleryItem[];
  treks: { slug: string; name: string }[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const [count, setCount] = useState(PAGE);
  const [active, setActive] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((i) => i.trekSlug === filter),
    [filter, items],
  );

  const visible = filtered.slice(0, count);
  const hasMore = count < filtered.length;

  const selectFilter = (f: string) => {
    setFilter(f);
    setCount(PAGE);
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => Math.min(c + PAGE, filtered.length));
        }
      },
      { rootMargin: "500px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const openAt = (item: GalleryItem) => setActive(filtered.indexOf(item));
  const step = (d: number) =>
    setActive((a) =>
      a === null ? null : (a + d + filtered.length) % filtered.length,
    );

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <FilterChip
          label="All"
          active={filter === "all"}
          onClick={() => selectFilter("all")}
        />
        {treks.map((t) => (
          <FilterChip
            key={t.slug}
            label={t.name}
            active={filter === t.slug}
            onClick={() => selectFilter(t.slug)}
          />
        ))}
      </div>

      <div className="columns-2 gap-3 sm:gap-4 lg:columns-3 [perspective:1600px]">
        {visible.map((item, i) => (
          <GalleryCard key={item.id} item={item} index={i} onOpen={openAt} />
        ))}
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="h-10" aria-hidden />
      ) : (
        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.18em] text-mist">
          That&apos;s all {filtered.length} shots.
        </p>
      )}

      <Lightbox
        items={filtered}
        index={active}
        onClose={() => setActive(null)}
        onStep={step}
      />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors",
        active
          ? "border-saffron bg-saffron/15 text-saffron"
          : "border-line bg-night-raised text-mist hover:border-line-strong hover:text-snow",
      )}
    >
      {label}
    </button>
  );
}