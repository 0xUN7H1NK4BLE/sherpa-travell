import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../src/lib/db/client";
import { treks, expeditions } from "../src/lib/db/schema";
import type { Trek } from "../src/data/treks";
import type { Expedition } from "../src/data/expeditions";

const dataDir = fileURLToPath(new URL("../src/data", import.meta.url));

async function seedTreks() {
  const raw: Trek[] = JSON.parse(readFileSync(`${dataDir}/treks.json`, "utf-8"));
  const rows = raw.map((t, position) => ({ ...t, position }));
  await db.insert(treks).values(rows);
  console.log(`Seeded ${rows.length} treks`);
}

async function seedExpeditions() {
  const raw: Expedition[] = JSON.parse(readFileSync(`${dataDir}/expeditions.json`, "utf-8"));
  const rows = raw.map((e, position) => ({ ...e, position }));
  await db.insert(expeditions).values(rows);
  console.log(`Seeded ${rows.length} expeditions`);
}

async function main() {
  await seedTreks();
  await seedExpeditions();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
