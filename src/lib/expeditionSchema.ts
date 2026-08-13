import { z } from "zod";
import { itineraryDaySchema, difficultySchema } from "./trekSchema";

export const expeditionTagSchema = z.enum([
  "trekking-peak",
  "technical",
  "altitude",
  "remote",
  "classic",
  "restricted",
]);

export const expeditionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().min(1),
  region: z.string().min(1),
  durationDays: z.number().int().positive(),
  maxAltitudeM: z.number().positive(),
  peakHeightM: z.number().positive(),
  climbingGrade: z.string().min(1),
  permitCostUSD: z.number().nonnegative(),
  technicalGearRequired: z.boolean(),
  summitSuccessNotes: z.string().default(""),
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
  tags: z.array(expeditionTagSchema),
});

export type ExpeditionInput = z.infer<typeof expeditionSchema>;
