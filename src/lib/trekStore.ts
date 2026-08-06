import type { Trek } from "@/data/treks";
import { readJson, writeJson } from "./jsonStore";

export const TREKS_FILE_REPO_PATH = "src/data/treks.json";

export async function readTreks(): Promise<Trek[]> {
  return readJson<Trek[]>(TREKS_FILE_REPO_PATH);
}

export async function writeTreks(treks: Trek[]): Promise<void> {
  await writeJson(TREKS_FILE_REPO_PATH, treks);
}
