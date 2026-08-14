// The gallery dataset: admin-managed scenes and films, rendered by the
// /gallery wall. All content here comes from the admin gallery panel —
// nothing is auto-derived from trek data.

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

export function buildGallery(content: GalleryContent): GalleryItem[] {
  const seen = new Set<string>();
  const items: GalleryItem[] = [];

  const push = (it: GalleryItem) => {
    if (!it.src || seen.has(it.src)) return;
    seen.add(it.src);
    items.push(it);
  };

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
