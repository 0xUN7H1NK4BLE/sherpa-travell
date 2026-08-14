import { test } from "node:test";
import assert from "node:assert/strict";
import { expeditionSchema } from "./expeditionSchema";
import { listExpeditions as getExpeditions } from "./expeditionStore";

test("every seeded expedition is valid against expeditionSchema", async () => {
  const expeditions = await getExpeditions();
  for (const expedition of expeditions) {
    const result = expeditionSchema.safeParse(expedition);
    assert.equal(result.success, true, `${expedition.slug}: ${result.success ? "" : JSON.stringify(result.error.issues)}`);
  }
});

test("every seeded expedition has three seed slugs present", async () => {
  const expeditions = await getExpeditions();
  const slugs = expeditions.map((e) => e.slug);
  assert.ok(slugs.includes("mt-himlung"));
  assert.ok(slugs.includes("ama-dablam"));
  assert.ok(slugs.includes("island-peak"));
});
