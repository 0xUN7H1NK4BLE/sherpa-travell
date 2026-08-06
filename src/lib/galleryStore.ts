import fs from "node:fs";
import path from "node:path";
import { GALLERY_FILE_REPO_PATH, type GalleryContent } from "@/data/galleryContent";
import { readJson, writeJson } from "./jsonStore";

export async function readGallery(): Promise<GalleryContent> {
  return readJson<GalleryContent>(GALLERY_FILE_REPO_PATH);
}

export async function writeGallery(content: GalleryContent): Promise<void> {
  await writeJson(GALLERY_FILE_REPO_PATH, content);
}

// Sync read of the committed local file — for statically-rendered pages
// (the gallery wall). Uses the same data the build ships.
export function readGalleryLocal(): GalleryContent {
  const raw = fs.readFileSync(path.join(process.cwd(), GALLERY_FILE_REPO_PATH), "utf8");
  return JSON.parse(raw) as GalleryContent;
}
