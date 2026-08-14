import { asc, eq, sql } from "drizzle-orm";
import type { Expedition } from "@/data/expeditions";
import { db } from "./db/client";
import { expeditions, type ExpeditionRow } from "./db/schema";

function rowToExpedition(row: ExpeditionRow): Expedition {
  const rest: Partial<ExpeditionRow> = { ...row };
  delete rest.position;
  return rest as unknown as Expedition;
}

function expeditionToRow(expedition: Expedition, position: number): typeof expeditions.$inferInsert {
  return { ...expedition, position };
}

export async function listExpeditions(): Promise<Expedition[]> {
  const rows = await db.select().from(expeditions).orderBy(asc(expeditions.position));
  return rows.map(rowToExpedition);
}

export async function getExpeditionBySlug(slug: string): Promise<Expedition | null> {
  const [row] = await db.select().from(expeditions).where(eq(expeditions.slug, slug)).limit(1);
  return row ? rowToExpedition(row) : null;
}

export async function insertExpedition(expedition: Expedition): Promise<void> {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${expeditions.position}), -1) + 1` })
    .from(expeditions);
  await db.insert(expeditions).values(expeditionToRow(expedition, next));
}

export async function updateExpedition(oldSlug: string, expedition: Expedition): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(expeditions)
      .where(eq(expeditions.slug, oldSlug))
      .limit(1);
    if (!existing) throw new Error(`Expedition not found: ${oldSlug}`);
    if (oldSlug === expedition.slug) {
      await tx
        .update(expeditions)
        .set(expeditionToRow(expedition, existing.position))
        .where(eq(expeditions.slug, oldSlug));
    } else {
      await tx.delete(expeditions).where(eq(expeditions.slug, oldSlug));
      await tx.insert(expeditions).values(expeditionToRow(expedition, existing.position));
    }
  });
}

export async function deleteExpedition(slug: string): Promise<void> {
  await db.delete(expeditions).where(eq(expeditions.slug, slug));
}
