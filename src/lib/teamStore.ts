import { asc, eq, sql } from "drizzle-orm";
import type { TeamMember } from "@/data/team";
import { db } from "./db/client";
import { teamMembers, type TeamMemberRow } from "./db/schema";

function rowToMember(row: TeamMemberRow): TeamMember {
  const rest: Partial<TeamMemberRow> = { ...row };
  delete rest.position;
  if (rest.bio === null) delete rest.bio;
  if (rest.instagram === null) delete rest.instagram;
  if (rest.facebook === null) delete rest.facebook;
  if (rest.whatsapp === null) delete rest.whatsapp;
  return rest as TeamMember;
}

function memberToRow(member: TeamMember, position: number): typeof teamMembers.$inferInsert {
  return { ...member, position };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const rows = await db.select().from(teamMembers).orderBy(asc(teamMembers.position));
  return rows.map(rowToMember);
}

export async function insertTeamMember(member: TeamMember): Promise<void> {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${teamMembers.position}), -1) + 1` })
    .from(teamMembers);
  await db.insert(teamMembers).values(memberToRow(member, next));
}

export async function updateTeamMember(id: string, member: TeamMember): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
    if (!existing) throw new Error(`Team member not found: ${id}`);
    if (id === member.id) {
      await tx
        .update(teamMembers)
        .set(memberToRow(member, existing.position))
        .where(eq(teamMembers.id, id));
    } else {
      await tx.delete(teamMembers).where(eq(teamMembers.id, id));
      await tx.insert(teamMembers).values(memberToRow(member, existing.position));
    }
  });
}

export async function deleteTeamMember(id: string): Promise<TeamMember | null> {
  const [row] = await db.delete(teamMembers).where(eq(teamMembers.id, id)).returning();
  return row ? rowToMember(row) : null;
}
