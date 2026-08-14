import { unstable_cache } from "next/cache";
import { listExpeditions } from "@/lib/expeditionStore";
import type { ItineraryDay } from "./treks";

export type ExpeditionTag = "trekking-peak" | "technical" | "altitude" | "remote" | "classic" | "restricted";
export type Difficulty = "Moderate" | "Challenging" | "Strenuous";

export interface Expedition {
  slug: string;
  name: string;
  region: string;
  durationDays: number;
  maxAltitudeM: number;
  peakHeightM: number;
  climbingGrade: string;
  permitCostUSD: number;
  technicalGearRequired: boolean;
  summitSuccessNotes: string;
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
  tags: ExpeditionTag[];
}

export const expeditionDifficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

const getExpeditionsCached = unstable_cache(() => listExpeditions(), ["expeditions"], {
  tags: ["expeditions"],
});

export async function getExpeditions(): Promise<Expedition[]> {
  return getExpeditionsCached();
}

export async function getExpedition(slug: string): Promise<Expedition | undefined> {
  return (await getExpeditions()).find((e) => e.slug === slug);
}

export async function getExpeditionRegions(): Promise<string[]> {
  return [...new Set((await getExpeditions()).map((e) => e.region))];
}
