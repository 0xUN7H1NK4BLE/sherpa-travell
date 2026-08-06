// The global gallery dataset: every trek hero, shared scene, per-day place
// photo, and any films, in one flat list the /gallery wall renders.
//
// To add a film: drop a .mp4 (and optional poster .jpg) into /public/gallery
// and add an entry to `galleryVideos` below — the wall picks it up with no
// other changes. Keep files under ~8MB for smooth streaming.

import { treks } from "@/data/treks";
import { trekPhotos } from "@/data/trekPhotos";
import { dayPlaces, trekLabels, type PlaceKind } from "@/data/dayViews";
import type { GalleryContent } from "@/data/galleryContent";

export type MediaType = "image" | "video";

export interface GalleryItem {
  id: string;
  type: MediaType;
  src: string;
  poster?: string;
  title: string;
  subtitle: string;
  badge?: string;
  trekSlug?: string;
  trekName?: string;
  alt: string;
  credit: string;
}

export interface GalleryVideo {
  id: string;
  src: string;
  poster?: string;
  title: string;
  subtitle?: string;
  trekSlug?: string;
  trekName?: string;
  alt: string;
}

const CREDIT = "Wikimedia Commons · CC BY-SA";

const KIND_LABEL: Record<PlaceKind, string> = {
  city: "City",
  village: "Village",
  peak: "Peak",
  pass: "Pass",
  lake: "Lake",
  monastery: "Monastery",
  basecamp: "Base Camp",
  river: "River",
};

function kindOfPlace(name?: string): string | undefined {
  if (!name) return undefined;
  const needle = name.toLowerCase();
  for (const slug of Object.keys(trekLabels)) {
    const hit = trekLabels[slug].find(
      (l) => l.name.toLowerCase() === needle,
    );
    if (hit) return KIND_LABEL[hit.kind];
  }
  return undefined;
}

export function buildGallery(content: GalleryContent): GalleryItem[] {
  const seen = new Set<string>();
  const items: GalleryItem[] = [];

  const push = (it: GalleryItem) => {
    if (!it.src || seen.has(it.src)) return;
    seen.add(it.src);
    items.push(it);
  };

  for (const t of treks) {
    push({
      id: `hero-${t.slug}`,
      type: "image",
      src: t.image,
      title: t.name,
      subtitle: t.region,
      badge: "Featured",
      trekSlug: t.slug,
      trekName: t.name,
      alt: `${t.name} — hero`,
      credit: CREDIT,
    });
  }

  for (const s of content.scenes) {
    push({
      id: s.id,
      type: "image",
      src: s.src,
      title: s.title,
      subtitle: s.subtitle,
      badge: "Scene",
      alt: s.alt,
      credit: s.credit || CREDIT,
    });
  }

  for (const t of treks) {
    const photos = trekPhotos[t.slug] ?? [];
    const places = dayPlaces[t.slug] ?? [];
    photos.forEach((src, i) => {
      const place = places[i]?.to;
      const title = place || t.name;
      push({
        id: `${t.slug}-${i}`,
        type: "image",
        src,
        title,
        subtitle: t.itinerary[i]?.title ?? "",
        badge: kindOfPlace(place) ?? "Place",
        trekSlug: t.slug,
        trekName: t.name,
        alt: `${title} — ${t.name}`,
        credit: CREDIT,
      });
    });
  }

  for (const v of content.videos) {
    push({
      id: v.id,
      type: "video",
      src: v.src,
      poster: v.poster,
      title: v.title,
      subtitle: v.subtitle ?? "Field film",
      badge: "Film",
      trekSlug: v.trekSlug,
      trekName: v.trekName,
      alt: v.alt,
      credit: v.credit || "Sherpa Treks Nepal",
    });
  }

  return items;
}
