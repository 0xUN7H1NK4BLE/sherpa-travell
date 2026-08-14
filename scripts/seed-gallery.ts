import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../src/lib/db/client";
import { galleryScenes, galleryFilms } from "../src/lib/db/schema";
import type { GalleryContent } from "../src/data/galleryContent";

const dataDir = fileURLToPath(new URL("../src/data", import.meta.url));

async function seedGallery() {
  const content: GalleryContent = JSON.parse(
    readFileSync(`${dataDir}/galleryContent.json`, "utf-8"),
  );

  if (content.scenes.length > 0) {
    const sceneRows = content.scenes.map((s, position) => ({ ...s, position }));
    await db.insert(galleryScenes).values(sceneRows);
    console.log(`Seeded ${sceneRows.length} gallery scenes`);
  }

  if (content.videos.length > 0) {
    const filmRows = content.videos.map((v, position) => ({ ...v, position }));
    await db.insert(galleryFilms).values(filmRows);
    console.log(`Seeded ${filmRows.length} gallery films`);
  }
}

seedGallery()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
