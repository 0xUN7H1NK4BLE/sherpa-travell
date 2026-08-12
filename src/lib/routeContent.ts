import type { ItineraryDay } from "@/data/treks";

export interface RouteContent {
  slug: string;
  name: string;
  region: string;
  durationDays: number;
  maxAltitudeM: number;
  difficulty: string;
  bestSeason: string[];
  groupSize: string;
  summary: string;
  itinerary: ItineraryDay[];
  coordinates: [number, number];
  path: [number, number][];
  image: string;
  gallery: string[];
  tags: string[];
}
