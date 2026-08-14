// Managed team roster shown on the About page.
// Stored in Neon Postgres, edited via the admin team panel.

import { unstable_cache } from "next/cache";
import { listTeamMembers } from "@/lib/teamStore";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

const getTeamMembersCached = unstable_cache(() => listTeamMembers(), ["team"], {
  tags: ["team"],
});

export async function getTeamMembers(): Promise<TeamMember[]> {
  return getTeamMembersCached();
}
