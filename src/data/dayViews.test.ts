import assert from "node:assert/strict";
import { test } from "node:test";
import { dayPlaces, trekLabels } from "./dayViews";
import { expeditions } from "./expeditions";
import { treks } from "./treks";

test("dayPlaces includes every trek slug with matching day count", () => {
  for (const t of treks) {
    assert.ok(dayPlaces[t.slug], `missing dayPlaces for trek ${t.slug}`);
    assert.equal(dayPlaces[t.slug].length, t.itinerary.length);
  }
});

test("dayPlaces includes every expedition slug with matching day count", () => {
  for (const e of expeditions) {
    assert.ok(dayPlaces[e.slug], `missing dayPlaces for expedition ${e.slug}`);
    assert.equal(dayPlaces[e.slug].length, e.itinerary.length);
  }
});

test("trekLabels includes every expedition's itinerary place names", () => {
  for (const e of expeditions) {
    const labels = trekLabels[e.slug];
    assert.ok(labels, `missing trekLabels for expedition ${e.slug}`);
    const names = new Set(labels.map((l) => l.name));
    for (const day of e.itinerary) {
      assert.ok(
        names.has(day.from.name),
        `${e.slug} trekLabels missing "${day.from.name}"`,
      );
      assert.ok(
        names.has(day.to.name),
        `${e.slug} trekLabels missing "${day.to.name}"`,
      );
    }
  }
});

test("ama-dablam day 0 dayPlaces matches its itinerary from/to names", () => {
  const ama = expeditions.find((e) => e.slug === "ama-dablam");
  assert.ok(ama, "ama-dablam fixture missing from expeditions.json");
  assert.equal(dayPlaces["ama-dablam"][0].from, ama.itinerary[0].from.name);
  assert.equal(dayPlaces["ama-dablam"][0].to, ama.itinerary[0].to.name);
});

test("no slug collisions between treks and expeditions", () => {
  const trekSlugs = new Set(treks.map((t) => t.slug));
  for (const e of expeditions) {
    assert.ok(!trekSlugs.has(e.slug), `slug collision: ${e.slug}`);
  }
});
