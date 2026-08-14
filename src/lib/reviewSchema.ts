import { z } from "zod";

export const reviewSubmitSchema = z.object({
  subjectType: z.enum(["trek", "expedition"]),
  subjectSlug: z.string().min(1).max(200),
  name: z.string().max(80).optional(),
  photoUrl: z.string().max(500).optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(2000),
});
