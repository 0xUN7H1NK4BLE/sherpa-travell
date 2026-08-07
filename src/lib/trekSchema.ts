import { z } from "zod";

export const dayKindSchema = z.enum(["trek", "acclimatization", "travel", "summit"]);
export const difficultySchema = z.enum(["Moderate", "Challenging", "Strenuous"]);
export const tagSchema = z.enum(["remote", "classic", "lakes", "restricted", "cultural"]);
export const placeKindSchema = z.enum([
  "city",
  "village",
  "peak",
  "pass",
  "lake",
  "monastery",
  "basecamp",
  "river",
]);

export const placeSchema = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  kind: placeKindSchema.default("village"),
});

export const itineraryDaySchema = z.object({
  day: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().default(""),
  altitudeM: z.number(),
  kind: dayKindSchema,
  from: placeSchema,
  to: placeSchema,
});

export const trekSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().min(1),
  region: z.string().min(1),
  durationDays: z.number().int().positive(),
  maxAltitudeM: z.number().positive(),
  difficulty: difficultySchema,
  bestSeason: z.array(z.string()),
  groupSize: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string()),
  itinerary: z.array(itineraryDaySchema),
  coordinates: z.tuple([z.number(), z.number()]),
  path: z.array(z.tuple([z.number(), z.number()])),
  image: z.string().min(1),
  gallery: z.array(z.string()),
  tags: z.array(tagSchema),
});
