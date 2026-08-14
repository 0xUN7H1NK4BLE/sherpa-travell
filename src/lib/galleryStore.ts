import { asc, eq, sql } from "drizzle-orm";
import type { GalleryContent, GalleryFilm, GalleryScene } from "@/data/galleryContent";
import { db } from "./db/client";
import { galleryFilms, galleryScenes, type GalleryFilmRow, type GallerySceneRow } from "./db/schema";

function rowToScene(row: GallerySceneRow): GalleryScene {
  const rest: Partial<GallerySceneRow> = { ...row };
  delete rest.position;
  return rest as unknown as GalleryScene;
}

function sceneToRow(scene: GalleryScene, position: number): typeof galleryScenes.$inferInsert {
  return { ...scene, position };
}

function rowToFilm(row: GalleryFilmRow): GalleryFilm {
  const rest: Partial<GalleryFilmRow> = { ...row };
  delete rest.position;
  const film = rest as unknown as GalleryFilm;
  if (film.poster === null) delete (film as { poster?: string }).poster;
  if (film.subtitle === null) delete (film as { subtitle?: string }).subtitle;
  if (film.trekSlug === null) delete (film as { trekSlug?: string }).trekSlug;
  if (film.trekName === null) delete (film as { trekName?: string }).trekName;
  return film;
}

function filmToRow(film: GalleryFilm, position: number): typeof galleryFilms.$inferInsert {
  return { ...film, position };
}

export async function listGalleryContent(): Promise<GalleryContent> {
  const [sceneRows, filmRows] = await Promise.all([
    db.select().from(galleryScenes).orderBy(asc(galleryScenes.position)),
    db.select().from(galleryFilms).orderBy(asc(galleryFilms.position)),
  ]);
  return {
    scenes: sceneRows.map(rowToScene),
    videos: filmRows.map(rowToFilm),
  };
}

export async function insertScene(scene: GalleryScene): Promise<void> {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${galleryScenes.position}), -1) + 1` })
    .from(galleryScenes);
  await db.insert(galleryScenes).values(sceneToRow(scene, next));
}

export async function updateScene(id: string, scene: GalleryScene): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(galleryScenes).where(eq(galleryScenes.id, id)).limit(1);
    if (!existing) throw new Error(`Gallery scene not found: ${id}`);
    if (id === scene.id) {
      await tx
        .update(galleryScenes)
        .set(sceneToRow(scene, existing.position))
        .where(eq(galleryScenes.id, id));
    } else {
      await tx.delete(galleryScenes).where(eq(galleryScenes.id, id));
      await tx.insert(galleryScenes).values(sceneToRow(scene, existing.position));
    }
  });
}

export async function deleteScene(id: string): Promise<GalleryScene | null> {
  const [row] = await db.delete(galleryScenes).where(eq(galleryScenes.id, id)).returning();
  return row ? rowToScene(row) : null;
}

export async function insertFilm(film: GalleryFilm): Promise<void> {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${galleryFilms.position}), -1) + 1` })
    .from(galleryFilms);
  await db.insert(galleryFilms).values(filmToRow(film, next));
}

export async function updateFilm(id: string, film: GalleryFilm): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(galleryFilms).where(eq(galleryFilms.id, id)).limit(1);
    if (!existing) throw new Error(`Gallery film not found: ${id}`);
    if (id === film.id) {
      await tx
        .update(galleryFilms)
        .set(filmToRow(film, existing.position))
        .where(eq(galleryFilms.id, id));
    } else {
      await tx.delete(galleryFilms).where(eq(galleryFilms.id, id));
      await tx.insert(galleryFilms).values(filmToRow(film, existing.position));
    }
  });
}

export async function deleteFilm(id: string): Promise<GalleryFilm | null> {
  const [row] = await db.delete(galleryFilms).where(eq(galleryFilms.id, id)).returning();
  return row ? rowToFilm(row) : null;
}
