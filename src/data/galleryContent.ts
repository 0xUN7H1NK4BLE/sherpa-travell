// Managed gallery content: scenes (photos) and films (videos).
// Stored in Neon Postgres, edited via the admin gallery panel.

import { unstable_cache } from "next/cache";
import { listGalleryContent } from "@/lib/galleryStore";

export interface GalleryScene {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  alt: string;
  credit: string;
}

export interface GalleryFilm {
  id: string;
  src: string;
  poster?: string;
  title: string;
  subtitle?: string;
  trekSlug?: string;
  trekName?: string;
  alt: string;
  credit: string;
}

export interface GalleryContent {
  scenes: GalleryScene[];
  videos: GalleryFilm[];
}

export const emptyGalleryContent: GalleryContent = {
  scenes: [],
  videos: [],
};

const getGalleryCached = unstable_cache(() => listGalleryContent(), ["gallery"], {
  tags: ["gallery"],
});

export async function getGalleryContent(): Promise<GalleryContent> {
  return getGalleryCached();
}