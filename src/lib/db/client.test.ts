import { test } from "node:test";
import assert from "node:assert/strict";
import { db } from "./client";
import { inquiries } from "./schema";

test("db client can query the inquiries table", async () => {
  const rows = await db.select().from(inquiries).limit(1);
  assert.ok(Array.isArray(rows));
});
