import assert from "node:assert/strict";
import { test } from "node:test";
import { getDayPlaces, getTrekLabels, scenicLabels } from "./dayViews";
import { listExpeditions as getExpeditions } from "@/lib/expeditionStore";
import { listTreks as getTreks } from "@/lib/trekStore";

test("dayPlaces includes every trek slug with matching day count", async () => {
  const treks = await getTreks();
  for (const t of treks) {
    const places = getDayPlaces(t);
    assert.ok(places, `missing dayPlaces for trek ${t.slug}`);
    assert.equal(places.length, t.itinerary.length);
  }
});

test("dayPlaces includes every expedition slug with matching day count", async () => {
  const expeditions = await getExpeditions();
  for (const e of expeditions) {
    const places = getDayPlaces(e);
    assert.ok(places, `missing dayPlaces for expedition ${e.slug}`);
    assert.equal(places.length, e.itinerary.length);
  }
});

test("trekLabels includes every expedition's itinerary place names", async () => {
  const expeditions = await getExpeditions();
  for (const e of expeditions) {
    const labels = getTrekLabels(e);
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

test("ama-dablam day 0 dayPlaces matches its itinerary from/to names", async () => {
  const expeditions = await getExpeditions();
  const ama = expeditions.find((e) => e.slug === "ama-dablam");
  assert.ok(ama, "ama-dablam fixture missing from expeditions.json");
  const places = getDayPlaces(ama);
  assert.equal(places[0].from, ama.itinerary[0].from.name);
  assert.equal(places[0].to, ama.itinerary[0].to.name);
});

test("no slug collisions between treks and expeditions", async () => {
  const [treks, expeditions] = await Promise.all([getTreks(), getExpeditions()]);
  const trekSlugs = new Set(treks.map((t) => t.slug));
  for (const e of expeditions) {
    assert.ok(!trekSlugs.has(e.slug), `slug collision: ${e.slug}`);
  }
});

test("everest-base-camp day 0 dayPlaces matches its itinerary from/to names", async () => {
  const treks = await getTreks();
  const trek = treks.find((t) => t.slug === "everest-base-camp");
  assert.ok(trek, "everest-base-camp fixture missing from treks");
  const places = getDayPlaces(trek);
  assert.equal(places[0].from, trek.itinerary[0].from.name);
  assert.equal(places[0].to, trek.itinerary[0].to.name);
});

test("trekLabels includes every trek's itinerary place names and scenic labels", async () => {
  const treks = await getTreks();
  for (const t of treks) {
    const labels = getTrekLabels(t);
    assert.ok(labels, `missing trekLabels for trek ${t.slug}`);
    const names = new Set(labels.map((l) => l.name));
    for (const day of t.itinerary) {
      assert.ok(
        names.has(day.from.name),
        `${t.slug} trekLabels missing "${day.from.name}"`,
      );
      assert.ok(
        names.has(day.to.name),
        `${t.slug} trekLabels missing "${day.to.name}"`,
      );
    }
    for (const scenic of scenicLabels[t.slug] ?? []) {
      assert.ok(
        names.has(scenic.name),
        `${t.slug} trekLabels missing scenic "${scenic.name}"`,
      );
    }
  }
});
