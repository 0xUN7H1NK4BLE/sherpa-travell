import { z } from "zod";

export const gallerySceneSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().default(""),
  alt: z.string().default(""),
  credit: z.string().default(""),
});

export const galleryFilmSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  poster: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  trekSlug: z.string().optional(),
  trekName: z.string().optional(),
  alt: z.string().default(""),
  credit: z.string().default(""),
});

export function newGalleryId(kind: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${kind}-${slug || Math.random().toString(36).slice(2, 7)}`;
}
