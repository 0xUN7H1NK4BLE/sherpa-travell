import expeditionsData from "./expeditions.json";
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

export const expeditions: Expedition[] = expeditionsData as Expedition[];

export const expeditionRegions = [...new Set(expeditions.map((e) => e.region))];
export const expeditionDifficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

export function getExpedition(slug: string): Expedition | undefined {
  return expeditions.find((e) => e.slug === slug);
}
