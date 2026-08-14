import { asc, eq, sql } from "drizzle-orm";
import type { Trek } from "@/data/treks";
import { db } from "./db/client";
import { treks, type TrekRow } from "./db/schema";

function rowToTrek(row: TrekRow): Trek {
  const rest: Partial<TrekRow> = { ...row };
  delete rest.position;
  return rest as unknown as Trek;
}

function trekToRow(trek: Trek, position: number): typeof treks.$inferInsert {
  return { ...trek, position };
}

export async function listTreks(): Promise<Trek[]> {
  const rows = await db.select().from(treks).orderBy(asc(treks.position));
  return rows.map(rowToTrek);
}

export async function getTrekBySlug(slug: string): Promise<Trek | null> {
  const [row] = await db.select().from(treks).where(eq(treks.slug, slug)).limit(1);
  return row ? rowToTrek(row) : null;
}

export async function insertTrek(trek: Trek): Promise<void> {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${treks.position}), -1) + 1` })
    .from(treks);
  await db.insert(treks).values(trekToRow(trek, next));
}

export async function updateTrek(oldSlug: string, trek: Trek): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(treks).where(eq(treks.slug, oldSlug)).limit(1);
    if (!existing) throw new Error(`Trek not found: ${oldSlug}`);
    if (oldSlug === trek.slug) {
      await tx
        .update(treks)
        .set(trekToRow(trek, existing.position))
        .where(eq(treks.slug, oldSlug));
    } else {
      await tx.delete(treks).where(eq(treks.slug, oldSlug));
      await tx.insert(treks).values(trekToRow(trek, existing.position));
    }
  });
}

export async function deleteTrek(slug: string): Promise<void> {
  await db.delete(treks).where(eq(treks.slug, slug));
}
