import type { Expedition } from "@/data/expeditions";
import { readJson, writeJson } from "./jsonStore";

export const EXPEDITIONS_FILE_REPO_PATH = "src/data/expeditions.json";

export async function readExpeditions(): Promise<Expedition[]> {
  return readJson<Expedition[]>(EXPEDITIONS_FILE_REPO_PATH);
}

export async function writeExpeditions(expeditions: Expedition[]): Promise<void> {
  await writeJson(EXPEDITIONS_FILE_REPO_PATH, expeditions);
}
