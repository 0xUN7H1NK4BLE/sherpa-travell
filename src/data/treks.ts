import { unstable_cache } from "next/cache";
import { listTreks } from "@/lib/trekStore";

export type TrekTag = "remote" | "classic" | "lakes" | "restricted" | "cultural";
export type Difficulty = "Moderate" | "Challenging" | "Strenuous";

export type DayKind = "trek" | "acclimatization" | "travel" | "summit";
export type PlaceKind =
  | "city"
  | "village"
  | "peak"
  | "pass"
  | "lake"
  | "monastery"
  | "basecamp"
  | "river";

export interface Place {
  name: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  altitudeM: number;
  kind: DayKind;
  from: Place;
  to: Place;
}

export interface Trek {
  slug: string;
  name: string;
  region: string;
  durationDays: number;
  maxAltitudeM: number;
  difficulty: Difficulty;
  bestSeason: string[];
  groupSize: string;
  summary: string;
  highlights: string[];
  itinerary: ItineraryDay[];
  coordinates: [number, number];
  path: [number, number][];
  image: string;
  gallery: string[];
  tags: TrekTag[];
}

const getTreksCached = unstable_cache(() => listTreks(), ["treks"], {
  tags: ["treks"],
});

export async function getTreks(): Promise<Trek[]> {
  return getTreksCached();
}

export async function getTrek(slug: string): Promise<Trek | undefined> {
  return (await getTreks()).find((t) => t.slug === slug);
}

export async function getRegions(): Promise<string[]> {
  return [...new Set((await getTreks()).map((t) => t.region))];
}

const FEATURED_SLUGS = ["upper-dolpo", "kanchenjunga-base-camp", "everest-base-camp", "limi-valley"];

export async function getFeaturedTreks(): Promise<Trek[]> {
  const all = await getTreks();
  return FEATURED_SLUGS.map((slug) => all.find((t) => t.slug === slug)).filter(
    (t): t is Trek => Boolean(t),
  );
}
