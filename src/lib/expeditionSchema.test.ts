import { test } from "node:test";
import assert from "node:assert/strict";
import { expeditionSchema } from "./expeditionSchema";

const validExpedition = {
  slug: "test-peak",
  name: "Test Peak Expedition",
  region: "Khumbu",
  durationDays: 8,
  maxAltitudeM: 6189,
  peakHeightM: 6189,
  climbingGrade: "Trekking peak",
  permitCostUSD: 600,
  technicalGearRequired: true,
  summitSuccessNotes: "",
  difficulty: "Challenging",
  bestSeason: ["Autumn"],
  groupSize: "2-10",
  summary: "A test peak.",
  highlights: ["Great views"],
  itinerary: [
    {
      day: 1,
      title: "Fly to Lukla",
      description: "",
      altitudeM: 2610,
      kind: "travel",
      from: { name: "Kathmandu", lat: 27.7, lng: 85.3, kind: "city" },
      to: { name: "Phakding", lat: 27.74, lng: 86.71, kind: "village" },
    },
  ],
  coordinates: [27.74, 86.71],
  path: [[27.74, 86.71]],
  image: "/images/test.jpg",
  gallery: [],
  tags: ["trekking-peak"],
};

test("expeditionSchema accepts a valid expedition", () => {
  const result = expeditionSchema.safeParse(validExpedition);
  assert.equal(result.success, true);
});

test("expeditionSchema rejects an invalid tag", () => {
  const result = expeditionSchema.safeParse({ ...validExpedition, tags: ["not-a-real-tag"] });
  assert.equal(result.success, false);
});

test("expeditionSchema rejects a negative peak height", () => {
  const result = expeditionSchema.safeParse({ ...validExpedition, peakHeightM: -100 });
  assert.equal(result.success, false);
});

test("expeditionSchema rejects an uppercase slug", () => {
  const result = expeditionSchema.safeParse({ ...validExpedition, slug: "Test-Peak" });
  assert.equal(result.success, false);
});
