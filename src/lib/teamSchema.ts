import { z } from "zod";

export const teamMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  role: z.string().min(1).max(80),
  photo: z.string().min(1),
  bio: z.string().max(300).optional(),
  instagram: z.string().max(300).optional(),
  facebook: z.string().max(300).optional(),
  whatsapp: z.string().max(300).optional(),
});

export function newTeamId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `member-${slug || Math.random().toString(36).slice(2, 7)}`;
}
