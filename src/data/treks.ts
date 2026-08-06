import treksData from "./treks.json";

export type TrekTag = "remote" | "classic" | "lakes" | "restricted" | "cultural";
export type Difficulty = "Moderate" | "Challenging" | "Strenuous";

export type DayKind = "trek" | "acclimatization" | "travel" | "summit";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  altitudeM: number;
  kind: DayKind;
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

export const treks: Trek[] = treksData as Trek[];

export const regions = [...new Set(treks.map((t) => t.region))];

export const difficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

export const dayKindLabel: Record<DayKind, string> = {
  trek: "Trek",
  acclimatization: "Acclimatization",
  travel: "Travel",
  summit: "High point",
};

export function getTrek(slug: string) {
  return treks.find((t) => t.slug === slug);
}

export const featuredTreks = [
  "upper-dolpo",
  "kanchenjunga-base-camp",
  "everest-base-camp",
  "limi-valley",
]
  .map((slug) => getTrek(slug))
  .filter((t): t is Trek => Boolean(t));
