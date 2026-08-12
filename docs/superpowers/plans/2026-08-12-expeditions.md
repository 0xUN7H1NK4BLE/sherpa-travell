# Expeditions Content Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "peak expedition" as a sibling content type to treks — full admin CRUD (create/edit/delete with the same UX as trek management), public listing and detail pages with the existing route map, seeded with three real expeditions (Mt Himlung, Ama Dablam, Island Peak).

**Architecture:** Expeditions get their own zod schema, JSON data file, and git-backed store, mirroring the existing trek pattern exactly (`trekSchema.ts` → `expeditionSchema.ts`, `treks.json` → `expeditions.json`, `trekStore.ts` → `expeditionStore.ts`). They share the itinerary/place primitives already defined in `trekSchema.ts` — no duplication of that shape. The seven existing trek-detail display components (`StageHero`, `TrekNav`, `TrekStage`, `StatsLedger`, `InquiryCTA`, `TrekStory`, `RouteMap`) are widened to accept a new structural type `RouteContent` instead of the concrete `Trek` type, plus an optional `basePath` prop (default `"/treks"`) on the three that contain route-path literals. Both `Trek` and the new `Expedition` type are structurally assignable to `RouteContent`, so this is a type-only change with zero behavior change for existing trek pages — a fresh admin/`ExpeditionForm.tsx`, `ExpeditionManager.tsx`, `ExpeditionFinder.tsx`, and two new route groups (`/expeditions`, `/expeditions/[slug]`) complete the feature.

**Tech Stack:** Next.js 16 (custom fork — see `AGENTS.md`/`node_modules/next/dist/docs/`), zod 4, existing `jsonStore.ts` git-as-database pattern, Tailwind, framer-motion, Google Maps JS API (via existing `RouteMap.tsx`).

## Global Constraints

- This is a custom Next.js 16 fork with breaking changes — read `node_modules/next/dist/docs/` before touching route files if anything looks unfamiliar; dynamic API routes use `RouteContext<'/path'>` (see `src/app/api/treks/[slug]/route.ts` for the pattern to copy exactly).
- Run `npx next typegen` after adding any new dynamic route (`src/app/api/expeditions/[slug]/route.ts`, `src/app/expeditions/[slug]/page.tsx`) — required before those files type-check.
- Test runner is native: `npm test` runs `node --import tsx --test src/**/*.test.ts`. New tests go in `*.test.ts` files next to the code they test, using `node:test` + `node:assert/strict` (see `src/lib/inquiryStore.test.ts` for the exact style to match).
- No new dependencies — everything needed (zod, existing store/auth/upload/map helpers) already exists in the repo.
- Follow existing code style exactly: no comments unless documenting genuine non-obvious behavior, Tailwind utility classes inline (no new CSS files), `"use client"` directive only on components that need it.
- Hosting is free-tier-only (per user's standing instruction) — this phase touches no paid infrastructure, so nothing to verify here beyond not adding new dependencies.

---

### Task 1: Shared `RouteContent` type + expedition zod schema

**Files:**
- Create: `src/lib/routeContent.ts`
- Create: `src/lib/expeditionSchema.ts`
- Test: `src/lib/expeditionSchema.test.ts`

**Interfaces:**
- Produces: `RouteContent` interface (consumed by Task 6's widened display components), `expeditionSchema` zod object + `expeditionTagSchema` enum (consumed by Task 2's `Expedition` type and Task 3's API routes).

- [ ] **Step 1: Create the shared `RouteContent` type**

```typescript
// src/lib/routeContent.ts
import type { ItineraryDay } from "@/data/treks";

export interface RouteContent {
  slug: string;
  name: string;
  region: string;
  durationDays: number;
  maxAltitudeM: number;
  difficulty: string;
  bestSeason: string[];
  groupSize: string;
  summary: string;
  itinerary: ItineraryDay[];
  coordinates: [number, number];
  path: [number, number][];
  image: string;
  gallery: string[];
  tags: string[];
}
```

This is the minimal field set every trek-detail display component (`StageHero`, `TrekNav`, `TrekStage`, `StatsLedger`, `InquiryCTA`, `TrekStory`, `RouteMap`) actually reads. Both `Trek` and the `Expedition` type (Task 2) have every one of these fields plus extras, so TypeScript accepts either wherever `RouteContent` is expected — no casting needed.

- [ ] **Step 2: Write the expedition schema**

```typescript
// src/lib/expeditionSchema.ts
import { z } from "zod";
import { itineraryDaySchema, difficultySchema } from "./trekSchema";

export const expeditionTagSchema = z.enum([
  "trekking-peak",
  "technical",
  "altitude",
  "remote",
  "classic",
]);

export const expeditionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  name: z.string().min(1),
  region: z.string().min(1),
  durationDays: z.number().int().positive(),
  maxAltitudeM: z.number().positive(),
  peakHeightM: z.number().positive(),
  climbingGrade: z.string().min(1),
  permitCostUSD: z.number().nonnegative(),
  technicalGearRequired: z.boolean(),
  summitSuccessNotes: z.string().default(""),
  difficulty: difficultySchema,
  bestSeason: z.array(z.string()),
  groupSize: z.string().min(1),
  summary: z.string().min(1),
  highlights: z.array(z.string()),
  itinerary: z.array(itineraryDaySchema),
  coordinates: z.tuple([z.number(), z.number()]),
  path: z.array(z.tuple([z.number(), z.number()])),
  image: z.string().min(1),
  gallery: z.array(z.string()),
  tags: z.array(expeditionTagSchema),
});

export type ExpeditionInput = z.infer<typeof expeditionSchema>;
```

- [ ] **Step 3: Write the failing test**

```typescript
// src/lib/expeditionSchema.test.ts
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
```

- [ ] **Step 4: Run the test to verify it fails, then passes**

Run: `npm test`
Expected first: `FAIL` — `Cannot find module './expeditionSchema'` (file doesn't exist yet if you ran this before Step 2; if you did Steps 2 and 3 together, it should already `PASS`).
After Step 2 is in place, re-run and expect all 4 tests to `PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/routeContent.ts src/lib/expeditionSchema.ts src/lib/expeditionSchema.test.ts
git commit -m "feat(expeditions): add expedition schema and shared RouteContent type"
```

---

### Task 2: Expedition data module, store, and seed data

**Files:**
- Create: `src/data/expeditions.json`
- Create: `src/data/expeditions.ts`
- Create: `src/lib/expeditionStore.ts`
- Test: `src/lib/expeditionStore.test.ts` (only if `GITHUB_REPO`/`GITHUB_TOKEN` are unset in the dev environment — it exercises the local-filesystem fallback path exactly like `readTreks`/`writeTreks` would; skip writing this test file if a quick check of `process.env` shows git-backed mode is active, since it would mutate `expeditions.json` on disk during CI runs)

**Interfaces:**
- Consumes: `expeditionSchema`/`ExpeditionInput` type shape from Task 1 (`src/lib/expeditionSchema.ts`), `readJson`/`writeJson` from `src/lib/jsonStore.ts` (already exists, unmodified), `ItineraryDay`/`Place`/`DayKind`/`PlaceKind` types from `src/data/treks.ts` (already exist, unmodified).
- Produces: `Expedition` interface, `expeditions: Expedition[]`, `expeditionRegions: string[]`, `expeditionDifficulties: Difficulty[]`, `getExpedition(slug): Expedition | undefined` from `src/data/expeditions.ts` (consumed by Tasks 3–8); `readExpeditions()`/`writeExpeditions()` from `src/lib/expeditionStore.ts` (consumed by Task 3).

- [ ] **Step 1: Write the seed data**

```json
// src/data/expeditions.json
[
  {
    "slug": "mt-himlung",
    "name": "Mt Himlung Expedition",
    "region": "Manang, Nar-Phu Valley",
    "durationDays": 9,
    "maxAltitudeM": 7126,
    "peakHeightM": 7126,
    "climbingGrade": "Alpine PD — glacier travel with fixed lines above Base Camp",
    "permitCostUSD": 1800,
    "technicalGearRequired": true,
    "summitSuccessNotes": "Best summit window is mid-September to mid-October; two rotations through High Camp materially improve success odds.",
    "difficulty": "Strenuous",
    "bestSeason": ["Spring", "Autumn"],
    "groupSize": "2–8",
    "summary": "A remote 7,000m peak above the restricted Nar-Phu valley, climbed via glacier travel and fixed lines — technical enough to test experienced climbers, without the crowds of the 8,000m circuit.",
    "highlights": [
      "Restricted Nar-Phu valley approach",
      "Glacier travel above Base Camp",
      "Summit views across the Manang Himal",
      "Small, high-touch expedition teams"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "Drive to Koto",
        "description": "A long, scenic drive from Kathmandu up the Marsyangdi valley to Koto, the gateway to the restricted Nar-Phu valley.",
        "altitudeM": 2600,
        "kind": "travel",
        "from": { "name": "Kathmandu", "lat": 27.6977, "lng": 85.3230, "kind": "city" },
        "to": { "name": "Koto", "lat": 28.5915, "lng": 84.2938, "kind": "village" }
      },
      {
        "day": 2,
        "title": "Koto to Meta",
        "description": "Enter the restricted Nar-Phu valley, following the Nar Khola gorge through pine forest and cliffside trail.",
        "altitudeM": 3560,
        "kind": "trek",
        "from": { "name": "Koto", "lat": 28.5915, "lng": 84.2938, "kind": "village" },
        "to": { "name": "Meta", "lat": 28.6500, "lng": 84.3000, "kind": "village" }
      },
      {
        "day": 3,
        "title": "Meta to Phu Gaon",
        "description": "Climb through narrowing gorge walls into the fortress-like village of Phu Gaon, one of the most remote settlements in Nepal.",
        "altitudeM": 4080,
        "kind": "trek",
        "from": { "name": "Meta", "lat": 28.6500, "lng": 84.3000, "kind": "village" },
        "to": { "name": "Phu Gaon", "lat": 28.8300, "lng": 84.4500, "kind": "village" }
      },
      {
        "day": 4,
        "title": "Acclimatization day in Phu Gaon",
        "description": "A rest day to explore Phu's gompa and let the body adjust before pushing higher toward Base Camp.",
        "altitudeM": 4080,
        "kind": "acclimatization",
        "from": { "name": "Phu Gaon", "lat": 28.8300, "lng": 84.4500, "kind": "village" },
        "to": { "name": "Phu Gaon", "lat": 28.8300, "lng": 84.4500, "kind": "village" }
      },
      {
        "day": 5,
        "title": "Phu Gaon to Himlung Base Camp",
        "description": "Leave the last permanent settlement behind and follow moraine trail to Base Camp beneath Himlung's south face.",
        "altitudeM": 4900,
        "kind": "trek",
        "from": { "name": "Phu Gaon", "lat": 28.8300, "lng": 84.4500, "kind": "village" },
        "to": { "name": "Himlung Base Camp", "lat": 28.8700, "lng": 84.4800, "kind": "basecamp" }
      },
      {
        "day": 6,
        "title": "Base Camp acclimatization and rotation",
        "description": "Rest, gear checks and a short rotation onto the lower glacier to prepare for the climb to High Camp.",
        "altitudeM": 4900,
        "kind": "acclimatization",
        "from": { "name": "Himlung Base Camp", "lat": 28.8700, "lng": 84.4800, "kind": "basecamp" },
        "to": { "name": "Himlung Base Camp", "lat": 28.8700, "lng": 84.4800, "kind": "basecamp" }
      },
      {
        "day": 7,
        "title": "Base Camp to High Camp",
        "description": "Rope up for the glacier crossing to High Camp, the last stop before the summit push.",
        "altitudeM": 5850,
        "kind": "trek",
        "from": { "name": "Himlung Base Camp", "lat": 28.8700, "lng": 84.4800, "kind": "basecamp" },
        "to": { "name": "High Camp", "lat": 28.8900, "lng": 84.5000, "kind": "basecamp" }
      },
      {
        "day": 8,
        "title": "Summit day",
        "description": "An early alpine start on fixed lines up the summit ridge, standing atop Himlung's 7,126m summit before descending to High Camp.",
        "altitudeM": 7126,
        "kind": "summit",
        "from": { "name": "High Camp", "lat": 28.8900, "lng": 84.5000, "kind": "basecamp" },
        "to": { "name": "Mt Himlung Summit", "lat": 28.9000, "lng": 84.5200, "kind": "peak" }
      },
      {
        "day": 9,
        "title": "Descend to Kathmandu",
        "description": "Retrace the valley trail to Koto and drive back to Kathmandu for a celebratory dinner.",
        "altitudeM": 1400,
        "kind": "travel",
        "from": { "name": "Mt Himlung Summit", "lat": 28.9000, "lng": 84.5200, "kind": "peak" },
        "to": { "name": "Kathmandu", "lat": 27.6977, "lng": 85.3230, "kind": "city" }
      }
    ],
    "coordinates": [28.5915, 84.2938],
    "path": [
      [28.5915, 84.2938],
      [28.6500, 84.3000],
      [28.8300, 84.4500],
      [28.8300, 84.4500],
      [28.8700, 84.4800],
      [28.8700, 84.4800],
      [28.8900, 84.5000],
      [28.9000, 84.5200],
      [27.6977, 85.3230]
    ],
    "image": "/images/scenes/glacier.jpg",
    "gallery": ["/images/scenes/valley.jpg", "/images/scenes/trail.jpg", "/images/places/dharapani.jpg"],
    "tags": ["technical", "altitude", "remote"]
  },
  {
    "slug": "ama-dablam",
    "name": "Ama Dablam Expedition",
    "region": "Khumbu",
    "durationDays": 10,
    "maxAltitudeM": 6812,
    "peakHeightM": 6812,
    "climbingGrade": "Alpine AD — steep fixed-rope sections above Camp 2",
    "permitCostUSD": 2500,
    "technicalGearRequired": true,
    "summitSuccessNotes": "One of the most photogenic 6,000ers in the world; the Yellow Tower and Mushroom Ridge sections demand solid jumaring technique.",
    "difficulty": "Strenuous",
    "bestSeason": ["Autumn"],
    "groupSize": "2–6",
    "summary": "The iconic sculpted peak above Tengboche — a technical, fixed-rope climb with some of the most exposed camps in the Himalaya.",
    "highlights": [
      "Classic Khumbu approach via Namche and Tengboche",
      "Camp 2's exposed granite ridge",
      "The Yellow Tower and Mushroom Ridge pitches",
      "Summit views of Everest, Lhotse and Makalu"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "Fly to Lukla, trek to Phakding",
        "description": "A dramatic mountain flight into Lukla, then an easy walk down the Dudh Koshi valley to Phakding.",
        "altitudeM": 2610,
        "kind": "travel",
        "from": { "name": "Kathmandu", "lat": 27.6977, "lng": 85.3230, "kind": "city" },
        "to": { "name": "Phakding", "lat": 27.7432, "lng": 86.7125, "kind": "village" }
      },
      {
        "day": 2,
        "title": "Phakding to Namche Bazaar",
        "description": "Cross the Hillary suspension bridges and climb steeply into the Sherpa capital, Namche Bazaar.",
        "altitudeM": 3440,
        "kind": "trek",
        "from": { "name": "Phakding", "lat": 27.7432, "lng": 86.7125, "kind": "village" },
        "to": { "name": "Namche Bazaar", "lat": 27.8045, "lng": 86.7102, "kind": "village" }
      },
      {
        "day": 3,
        "title": "Acclimatization day in Namche",
        "description": "A rest day with a short hike up to the Everest View Hotel for first sight of the big peaks.",
        "altitudeM": 3440,
        "kind": "acclimatization",
        "from": { "name": "Namche Bazaar", "lat": 27.8045, "lng": 86.7102, "kind": "village" },
        "to": { "name": "Namche Bazaar", "lat": 27.8045, "lng": 86.7102, "kind": "village" }
      },
      {
        "day": 4,
        "title": "Namche to Tengboche",
        "description": "A rolling trail with the first full view of Ama Dablam's sculpted ridgeline, ending at Tengboche's famous monastery.",
        "altitudeM": 3860,
        "kind": "trek",
        "from": { "name": "Namche Bazaar", "lat": 27.8045, "lng": 86.7102, "kind": "village" },
        "to": { "name": "Tengboche", "lat": 27.8365, "lng": 86.7638, "kind": "village" }
      },
      {
        "day": 5,
        "title": "Tengboche to Pangboche",
        "description": "Descend through rhododendron forest and climb again to Pangboche, home to the Khumbu's oldest monastery.",
        "altitudeM": 3985,
        "kind": "trek",
        "from": { "name": "Tengboche", "lat": 27.8365, "lng": 86.7638, "kind": "village" },
        "to": { "name": "Pangboche", "lat": 27.8330, "lng": 86.7880, "kind": "village" }
      },
      {
        "day": 6,
        "title": "Pangboche to Ama Dablam Base Camp",
        "description": "Leave the main trekking trail and climb moraine to Base Camp, pitched directly beneath the peak's south-west ridge.",
        "altitudeM": 4570,
        "kind": "trek",
        "from": { "name": "Pangboche", "lat": 27.8330, "lng": 86.7880, "kind": "village" },
        "to": { "name": "Ama Dablam Base Camp", "lat": 27.8614, "lng": 86.8611, "kind": "basecamp" }
      },
      {
        "day": 7,
        "title": "Base Camp acclimatization and rotation",
        "description": "Rest, technical gear checks, and a rotation partway up the ridge to fix ropes and pre-acclimatize.",
        "altitudeM": 4570,
        "kind": "acclimatization",
        "from": { "name": "Ama Dablam Base Camp", "lat": 27.8614, "lng": 86.8611, "kind": "basecamp" },
        "to": { "name": "Ama Dablam Base Camp", "lat": 27.8614, "lng": 86.8611, "kind": "basecamp" }
      },
      {
        "day": 8,
        "title": "Base Camp to Camp 2",
        "description": "Climb the exposed granite ridge past Camp 1 to Camp 2's dramatically perched tent platforms.",
        "altitudeM": 5900,
        "kind": "trek",
        "from": { "name": "Ama Dablam Base Camp", "lat": 27.8614, "lng": 86.8611, "kind": "basecamp" },
        "to": { "name": "Camp 2", "lat": 27.8600, "lng": 86.8580, "kind": "basecamp" }
      },
      {
        "day": 9,
        "title": "Summit day",
        "description": "Jumar the fixed ropes through the Yellow Tower and Mushroom Ridge to the summit, with Everest and Lhotse filling the skyline.",
        "altitudeM": 6812,
        "kind": "summit",
        "from": { "name": "Camp 2", "lat": 27.8600, "lng": 86.8580, "kind": "basecamp" },
        "to": { "name": "Ama Dablam Summit", "lat": 27.8608, "lng": 86.8611, "kind": "peak" }
      },
      {
        "day": 10,
        "title": "Descend to Lukla, fly to Kathmandu",
        "description": "A long descent day back down the valley to Lukla, followed by the flight home to Kathmandu.",
        "altitudeM": 1400,
        "kind": "travel",
        "from": { "name": "Ama Dablam Summit", "lat": 27.8608, "lng": 86.8611, "kind": "peak" },
        "to": { "name": "Kathmandu", "lat": 27.6977, "lng": 85.3230, "kind": "city" }
      }
    ],
    "coordinates": [27.7432, 86.7125],
    "path": [
      [27.7432, 86.7125],
      [27.8045, 86.7102],
      [27.8045, 86.7102],
      [27.8365, 86.7638],
      [27.8330, 86.7880],
      [27.8614, 86.8611],
      [27.8614, 86.8611],
      [27.8600, 86.8580],
      [27.8608, 86.8611],
      [27.6977, 85.3230]
    ],
    "image": "/images/places/amadablam.jpg",
    "gallery": ["/images/places/tengboche.jpg", "/images/places/namche.jpg", "/images/places/dingboche.jpg"],
    "tags": ["technical", "classic", "altitude"]
  },
  {
    "slug": "island-peak",
    "name": "Island Peak Expedition",
    "region": "Khumbu",
    "durationDays": 8,
    "maxAltitudeM": 6189,
    "peakHeightM": 6189,
    "climbingGrade": "Trekking peak — glacier walk with a fixed-rope headwall near the summit",
    "permitCostUSD": 600,
    "technicalGearRequired": true,
    "summitSuccessNotes": "The most accessible 6,000m summit in the Khumbu — strong trek fitness plus a day of basic ice-climbing training is normally enough.",
    "difficulty": "Challenging",
    "bestSeason": ["Spring", "Autumn"],
    "groupSize": "2–10",
    "summary": "Nepal's most popular trekking peak — a glacier walk to a fixed-rope headwall, with sweeping views of Lhotse, Makalu and Ama Dablam from the summit ridge.",
    "highlights": [
      "Beginner-friendly climbing training day",
      "Glacier crossing on the Lhotse Nup Glacier",
      "Fixed-rope headwall to the summit ridge",
      "Views of four 8,000m peaks from the top"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "Fly to Lukla, trek to Phakding",
        "description": "A dramatic mountain flight into Lukla, then an easy walk down the Dudh Koshi valley to Phakding.",
        "altitudeM": 2610,
        "kind": "travel",
        "from": { "name": "Kathmandu", "lat": 27.6977, "lng": 85.3230, "kind": "city" },
        "to": { "name": "Phakding", "lat": 27.7432, "lng": 86.7125, "kind": "village" }
      },
      {
        "day": 2,
        "title": "Phakding to Namche Bazaar",
        "description": "Cross the Hillary suspension bridges and climb steeply into the Sherpa capital, Namche Bazaar.",
        "altitudeM": 3440,
        "kind": "trek",
        "from": { "name": "Phakding", "lat": 27.7432, "lng": 86.7125, "kind": "village" },
        "to": { "name": "Namche Bazaar", "lat": 27.8045, "lng": 86.7102, "kind": "village" }
      },
      {
        "day": 3,
        "title": "Namche to Tengboche",
        "description": "A rolling trail with wide Himalayan views, ending at Tengboche's famous monastery.",
        "altitudeM": 3860,
        "kind": "trek",
        "from": { "name": "Namche Bazaar", "lat": 27.8045, "lng": 86.7102, "kind": "village" },
        "to": { "name": "Tengboche", "lat": 27.8365, "lng": 86.7638, "kind": "village" }
      },
      {
        "day": 4,
        "title": "Tengboche to Dingboche",
        "description": "Follow the Imja Khola valley up into drier, higher terrain, with Ama Dablam close overhead.",
        "altitudeM": 4410,
        "kind": "trek",
        "from": { "name": "Tengboche", "lat": 27.8365, "lng": 86.7638, "kind": "village" },
        "to": { "name": "Dingboche", "lat": 27.8953, "lng": 86.8278, "kind": "village" }
      },
      {
        "day": 5,
        "title": "Dingboche to Chhukung",
        "description": "A short, high acclimatization walk to Chhukung, the last village before Island Peak's approach.",
        "altitudeM": 4730,
        "kind": "trek",
        "from": { "name": "Dingboche", "lat": 27.8953, "lng": 86.8278, "kind": "village" },
        "to": { "name": "Chhukung", "lat": 27.8860, "lng": 86.8760, "kind": "village" }
      },
      {
        "day": 6,
        "title": "Chhukung to Island Peak Base Camp",
        "description": "Cross moraine below the Lhotse Nup Glacier to Base Camp, with a climbing-technique refresher on arrival.",
        "altitudeM": 5087,
        "kind": "trek",
        "from": { "name": "Chhukung", "lat": 27.8860, "lng": 86.8760, "kind": "village" },
        "to": { "name": "Island Peak Base Camp", "lat": 27.9210, "lng": 86.9340, "kind": "basecamp" }
      },
      {
        "day": 7,
        "title": "Summit day",
        "description": "An early start across the glacier and up the fixed-rope headwall to the summit ridge, with Lhotse, Makalu and Ama Dablam all visible from the top.",
        "altitudeM": 6189,
        "kind": "summit",
        "from": { "name": "Island Peak Base Camp", "lat": 27.9210, "lng": 86.9340, "kind": "basecamp" },
        "to": { "name": "Island Peak Summit", "lat": 27.9255, "lng": 86.9361, "kind": "peak" }
      },
      {
        "day": 8,
        "title": "Descend to Lukla, fly to Kathmandu",
        "description": "A long descent back down the valley to Lukla, followed by the flight home to Kathmandu.",
        "altitudeM": 1400,
        "kind": "travel",
        "from": { "name": "Island Peak Summit", "lat": 27.9255, "lng": 86.9361, "kind": "peak" },
        "to": { "name": "Kathmandu", "lat": 27.6977, "lng": 85.3230, "kind": "city" }
      }
    ],
    "coordinates": [27.7432, 86.7125],
    "path": [
      [27.7432, 86.7125],
      [27.8045, 86.7102],
      [27.8365, 86.7638],
      [27.8953, 86.8278],
      [27.8860, 86.8760],
      [27.9210, 86.9340],
      [27.9255, 86.9361],
      [27.6977, 85.3230]
    ],
    "image": "/images/places/dingboche.jpg",
    "gallery": ["/images/scenes/glacier.jpg", "/images/places/tengboche.jpg", "/images/scenes/valley.jpg"],
    "tags": ["trekking-peak", "altitude", "classic"]
  }
]
```

- [ ] **Step 2: Write the data module**

```typescript
// src/data/expeditions.ts
import expeditionsData from "./expeditions.json";
import type { ItineraryDay } from "./treks";

export type ExpeditionTag = "trekking-peak" | "technical" | "altitude" | "remote" | "classic";
export type Difficulty = "Moderate" | "Challenging" | "Strenuous";

export interface Expedition {
  slug: string;
  name: string;
  region: string;
  durationDays: number;
  maxAltitudeM: number;
  peakHeightM: number;
  climbingGrade: string;
  permitCostUSD: number;
  technicalGearRequired: boolean;
  summitSuccessNotes: string;
  difficulty: Difficulty;
  bestSeason: string[];
  groupSize: string;
  summary: string;
  highlights: string[];
  itinerary: ItineraryDay[];
  coordinates: [number, number];
  path: [number, number][];
  image: string;
  gallery: string[];
  tags: ExpeditionTag[];
}

export const expeditions: Expedition[] = expeditionsData as Expedition[];

export const expeditionRegions = [...new Set(expeditions.map((e) => e.region))];
export const expeditionDifficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

export function getExpedition(slug: string): Expedition | undefined {
  return expeditions.find((e) => e.slug === slug);
}
```

- [ ] **Step 3: Write the store (mirrors `trekStore.ts`)**

```typescript
// src/lib/expeditionStore.ts
import type { Expedition } from "@/data/expeditions";
import { readJson, writeJson } from "./jsonStore";

export const EXPEDITIONS_FILE_REPO_PATH = "src/data/expeditions.json";

export async function readExpeditions(): Promise<Expedition[]> {
  return readJson<Expedition[]>(EXPEDITIONS_FILE_REPO_PATH);
}

export async function writeExpeditions(expeditions: Expedition[]): Promise<void> {
  await writeJson(EXPEDITIONS_FILE_REPO_PATH, expeditions);
}
```

- [ ] **Step 4: Verify the seed data parses against the schema**

```typescript
// src/lib/expeditionStore.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { expeditionSchema } from "./expeditionSchema";
import { expeditions } from "@/data/expeditions";

test("every seeded expedition is valid against expeditionSchema", () => {
  for (const expedition of expeditions) {
    const result = expeditionSchema.safeParse(expedition);
    assert.equal(result.success, true, `${expedition.slug}: ${result.success ? "" : JSON.stringify(result.error.issues)}`);
  }
});

test("every seeded expedition has three seed slugs present", () => {
  const slugs = expeditions.map((e) => e.slug);
  assert.ok(slugs.includes("mt-himlung"));
  assert.ok(slugs.includes("ama-dablam"));
  assert.ok(slugs.includes("island-peak"));
});
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: `PASS` for all tests in `expeditionStore.test.ts` (this validates Step 1's JSON against Task 1's schema — if it fails, the JSON has a typo or a field that doesn't match the schema; fix the JSON, not the schema).

- [ ] **Step 6: Commit**

```bash
git add src/data/expeditions.json src/data/expeditions.ts src/lib/expeditionStore.ts src/lib/expeditionStore.test.ts
git commit -m "feat(expeditions): add expedition data module, store, and seed data (Mt Himlung, Ama Dablam, Island Peak)"
```

---

### Task 3: Admin API routes for expeditions

**Files:**
- Create: `src/app/api/expeditions/route.ts`
- Create: `src/app/api/expeditions/[slug]/route.ts`

**Interfaces:**
- Consumes: `expeditionSchema` (Task 1), `readExpeditions`/`writeExpeditions` (Task 2), `isAuthenticated` from `src/lib/adminAuth.ts` (already exists, unmodified), `deleteBlobRefs` from `src/lib/blobCleanup.ts` (already exists, unmodified).
- Produces: `GET /api/expeditions` (public, `{ ok, expeditions }`), `POST /api/expeditions` (auth-gated), `PUT /api/expeditions/[slug]` (auth-gated), `DELETE /api/expeditions/[slug]` (auth-gated) — consumed by Task 4/5's admin components and Task 7/8's public pages.

- [ ] **Step 1: Run `next typegen` first so the new dynamic route's `RouteContext` type exists**

Run: `npx next typegen`

This scans `src/app` for route files, including ones that don't exist yet if you create the directory first — so create `src/app/api/expeditions/[slug]/` (even an empty placeholder file) before running this, or just write the route file in Step 3 below and re-run typegen after.

- [ ] **Step 2: Write the collection route (mirrors `src/app/api/treks/route.ts` exactly, swapping trek → expedition)**

```typescript
// src/app/api/expeditions/route.ts
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { expeditionSchema } from "@/lib/expeditionSchema";
import { readExpeditions, writeExpeditions } from "@/lib/expeditionStore";

export async function GET() {
  const expeditions = await readExpeditions();
  return Response.json({ ok: true, expeditions });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = expeditionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid expedition", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const expeditions = await readExpeditions();
  if (expeditions.some((e) => e.slug === parsed.data.slug)) {
    return Response.json({ ok: false, error: "An expedition with that slug already exists" }, { status: 409 });
  }
  expeditions.push(parsed.data);
  await writeExpeditions(expeditions);
  return Response.json({ ok: true, expedition: parsed.data });
}
```

- [ ] **Step 3: Write the `[slug]` route (mirrors `src/app/api/treks/[slug]/route.ts` exactly)**

```typescript
// src/app/api/expeditions/[slug]/route.ts
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { expeditionSchema } from "@/lib/expeditionSchema";
import { readExpeditions, writeExpeditions } from "@/lib/expeditionStore";
import { deleteBlobRefs } from "@/lib/blobCleanup";

export async function PUT(request: Request, ctx: RouteContext<"/api/expeditions/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = expeditionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid expedition", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }
  const expeditions = await readExpeditions();
  const idx = expeditions.findIndex((e) => e.slug === slug);
  if (idx === -1) {
    return Response.json({ ok: false, error: "Expedition not found" }, { status: 404 });
  }
  if (parsed.data.slug !== slug && expeditions.some((e) => e.slug === parsed.data.slug)) {
    return Response.json({ ok: false, error: "An expedition with that slug already exists" }, { status: 409 });
  }
  expeditions[idx] = parsed.data;
  await writeExpeditions(expeditions);
  return Response.json({ ok: true, expedition: parsed.data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/expeditions/[slug]">) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const expeditions = await readExpeditions();
  const idx = expeditions.findIndex((e) => e.slug === slug);
  if (idx === -1) {
    return Response.json({ ok: false, error: "Expedition not found" }, { status: 404 });
  }
  const [expedition] = expeditions.splice(idx, 1);
  await writeExpeditions(expeditions);
  await deleteBlobRefs([expedition.image, ...(expedition.gallery ?? [])]);
  return Response.json({ ok: true });
}
```

- [ ] **Step 4: Re-run typegen and verify the build compiles**

Run: `npx next typegen && npx tsc --noEmit`
Expected: no errors referencing `RouteContext<"/api/expeditions/[slug]">`.

- [ ] **Step 5: Manually verify the routes**

Run the dev server (`npm run dev`) in one terminal, then in another:

```bash
curl -s http://localhost:3000/api/expeditions | head -c 200
```

Expected: JSON starting with `{"ok":true,"expeditions":[...` containing the three seeded expeditions.

```bash
curl -s -X POST http://localhost:3000/api/expeditions -H "Content-Type: application/json" -d '{}'
```

Expected: `{"ok":false,"error":"Unauthorized"}` with a 401 (unauthenticated POST is correctly rejected).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/expeditions
git commit -m "feat(expeditions): add /api/expeditions CRUD routes"
```

---

### Task 4: `ExpeditionForm.tsx` admin component

**Files:**
- Create: `src/components/admin/ExpeditionForm.tsx`

**Interfaces:**
- Consumes: `Expedition` type (Task 2), `ImageUpload` (`src/components/admin/ImageUpload.tsx`, already exists, unmodified — `onUploaded: (url: string) => void` prop), `DayMap` (`src/components/admin/DayMap.tsx`, already exists, unmodified — `{ from, to, single, onPlace }` props), `toSlug` (`src/lib/slug.ts`, already exists, unmodified).
- Produces: `<ExpeditionForm initial={expedition | null} onSaved={() => void} onCancel={() => void} />` — consumed by Task 5's `ExpeditionManager.tsx`.

This mirrors `src/components/admin/TrekForm.tsx` field-for-field, with five additions: `peakHeightM`, `climbingGrade`, `permitCostUSD`, `technicalGearRequired`, `summitSuccessNotes`, and the expedition tag set swapped in for the trek tag set.

- [ ] **Step 1: Write the component**

```typescript
// src/components/admin/ExpeditionForm.tsx
"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import DayMap from "./DayMap";
import { toSlug } from "@/lib/slug";
import type { Expedition } from "@/data/expeditions";

type FormState = Expedition;

const emptyExpedition: FormState = {
  slug: "",
  name: "",
  region: "",
  durationDays: 1,
  maxAltitudeM: 0,
  peakHeightM: 0,
  climbingGrade: "",
  permitCostUSD: 0,
  technicalGearRequired: false,
  summitSuccessNotes: "",
  difficulty: "Moderate",
  bestSeason: [""],
  groupSize: "2–10",
  summary: "",
  highlights: [],
  itinerary: [
    {
      day: 1,
      title: "",
      kind: "trek",
      altitudeM: 0,
      description: "",
      from: { name: "", lat: 0, lng: 0, kind: "village" },
      to: { name: "", lat: 0, lng: 0, kind: "village" },
    },
  ],
  coordinates: [0, 0],
  path: [[0, 0]],
  image: "",
  gallery: [],
  tags: [],
};

const allTags: Expedition["tags"] = ["trekking-peak", "technical", "altitude", "remote", "classic"];
const allDifficulties: Expedition["difficulty"][] = ["Moderate", "Challenging", "Strenuous"];
const allKinds: Expedition["itinerary"][number]["kind"][] = ["trek", "acclimatization", "travel", "summit"];

const field = "rounded-lg border border-line-strong bg-night px-3.5 py-2.5 text-sm text-snow outline-none transition-colors focus:border-saffron";
const label = "text-xs uppercase tracking-[0.18em] text-mist";
const inputRow = "flex flex-col gap-1.5";

export default function ExpeditionForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Expedition | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial ?? emptyExpedition);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setListString(
    key: "bestSeason" | "highlights" | "gallery" | "tags",
    value: string[],
  ) {
    set(key, value);
  }

  function deriveCoords(it: FormState["itinerary"], fallback: FormState["coordinates"]) {
    const first = it[0]?.to;
    if (first && Number.isFinite(first.lat) && Number.isFinite(first.lng)) {
      return [first.lat, first.lng] as [number, number];
    }
    return fallback;
  }

  function updatePlace(i: number, which: "from" | "to", patch: Partial<Expedition["itinerary"][number]["from"]>) {
    setForm((f) => {
      const it = f.itinerary.map((d, j) => {
        if (j !== i) return d;
        if (d.kind === "acclimatization") {
          const p = { ...d.from, ...patch };
          return { ...d, from: p, to: p };
        }
        return { ...d, [which]: { ...d[which], ...patch } };
      });
      return {
        ...f,
        itinerary: it,
        path: it.map((d) => [d.to.lat, d.to.lng] as [number, number]),
        coordinates: deriveCoords(it, f.coordinates),
      };
    });
  }

  function updateKind(i: number, kind: Expedition["itinerary"][number]["kind"]) {
    setForm((f) => {
      const it = f.itinerary.map((d, j) => {
        if (j !== i) return d;
        if (kind === "acclimatization") {
          return { ...d, kind, to: { ...d.from } };
        }
        return { ...d, kind };
      });
      return {
        ...f,
        itinerary: it,
        path: it.map((d) => [d.to.lat, d.to.lng] as [number, number]),
        coordinates: deriveCoords(it, f.coordinates),
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Expedition = {
      ...form,
      bestSeason: form.bestSeason.filter(Boolean),
      highlights: form.highlights.filter(Boolean),
      gallery: form.gallery.filter(Boolean),
      itinerary: form.itinerary.map((d, i) => ({ ...d, day: i + 1 })),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/expeditions/${initial?.slug}` : "/api/expeditions",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const issues = data.issues as Record<string, unknown> | undefined;
        if (issues && Object.keys(issues).length > 0) {
          const lines = Object.entries(issues)
            .map(([field, val]) => `${field}: ${Array.isArray(val) ? val.join(", ") : String(val)}`);
          setError(lines.join("\n"));
        } else {
          setError(typeof data.error === "string" ? data.error : "Save failed");
        }
        setSaving(false);
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-2xl border border-line bg-night/40 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-light">
          {isEdit ? `Edit ${initial?.name}` : "New expedition"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-mist underline underline-offset-4 hover:text-snow"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className={inputRow}>
          <label className={label}>Name</label>
          <input
            className={field}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              set("name", name);
              if (!isEdit) set("slug", toSlug(name));
            }}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Slug</label>
          <input
            className={field}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Region</label>
          <input
            className={field}
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Group size</label>
          <input
            className={field}
            value={form.groupSize}
            onChange={(e) => set("groupSize", e.target.value)}
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Duration (days)</label>
          <input
            type="number"
            className={field}
            value={form.durationDays}
            onChange={(e) => set("durationDays", Number(e.target.value))}
            min={1}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Max altitude (m)</label>
          <input
            type="number"
            className={field}
            value={form.maxAltitudeM}
            onChange={(e) => set("maxAltitudeM", Number(e.target.value))}
            min={0}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Peak height (m)</label>
          <input
            type="number"
            className={field}
            value={form.peakHeightM}
            onChange={(e) => set("peakHeightM", Number(e.target.value))}
            min={0}
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Climbing grade</label>
          <input
            className={field}
            value={form.climbingGrade}
            onChange={(e) => set("climbingGrade", e.target.value)}
            placeholder="e.g. Alpine PD, Trekking peak"
            required
          />
        </div>
        <div className={inputRow}>
          <label className={label}>Permit cost (USD)</label>
          <input
            type="number"
            className={field}
            value={form.permitCostUSD}
            onChange={(e) => set("permitCostUSD", Number(e.target.value))}
            min={0}
            required
          />
        </div>
        <div className="flex items-end gap-2 pb-2.5">
          <input
            type="checkbox"
            id="technicalGearRequired"
            checked={form.technicalGearRequired}
            onChange={(e) => set("technicalGearRequired", e.target.checked)}
            className="h-4 w-4 rounded border-line-strong bg-night accent-saffron"
          />
          <label htmlFor="technicalGearRequired" className={label}>
            Technical gear required
          </label>
        </div>
        <div className={inputRow}>
          <label className={label}>Difficulty</label>
          <select
            className={field}
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value as Expedition["difficulty"])}
          >
            {allDifficulties.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className={inputRow}>
          <label className={label}>Tags</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {allTags.map((tag) => {
              const active = form.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setListString(
                      "tags",
                      active
                        ? form.tags.filter((t) => t !== tag)
                        : [...form.tags, tag],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide ${
                    active
                      ? "border-saffron bg-saffron text-night"
                      : "border-line-strong text-mist hover:text-snow"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={inputRow}>
        <label className={label}>Summary</label>
        <textarea
          className={field}
          rows={3}
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
          required
        />
      </div>

      <div className={inputRow}>
        <label className={label}>Summit success notes</label>
        <textarea
          className={field}
          rows={2}
          value={form.summitSuccessNotes}
          onChange={(e) => set("summitSuccessNotes", e.target.value)}
        />
      </div>

      <div className={inputRow}>
        <label className={label}>Best season (comma separated)</label>
        <input
          className={field}
          value={form.bestSeason.join(", ")}
          onChange={(e) =>
            setListString(
              "bestSeason",
              e.target.value.split(",").map((s) => s.trim()),
            )
          }
        />
      </div>

      <ListEditor
        title="Highlights"
        items={form.highlights}
        onChange={(items) => setListString("highlights", items)}
        placeholder="One highlight per line"
        textarea
      />

      <div className="flex flex-col gap-5 border-t border-line pt-5 md:flex-row">
        <div className="flex-1">
          <label className={label}>Hero image</label>
          <div className="mt-2 flex flex-col gap-2">
            <ImageUpload onUploaded={(url) => set("image", url)} label="Upload hero image" />
            {form.image && (
              <div className="flex items-center gap-3">
                <img
                  src={form.image}
                  alt="Hero preview"
                  className="h-16 w-24 rounded-lg object-cover"
                />
                <input
                  className={field}
                  value={form.image}
                  onChange={(e) => set("image", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <label className={label}>Gallery images</label>
          <div className="mt-2 flex flex-col gap-2">
            <ImageUpload onUploaded={(url) => setListString("gallery", [...form.gallery, url])} label="Upload gallery image" />
            <div className="flex flex-col gap-2">
              {form.gallery.map((url, i) => (
                <div key={`${url}-${i}`} className="flex items-center gap-2">
                  <img src={url} alt="" className="h-10 w-14 rounded object-cover" />
                  <input
                    className={field}
                    value={url}
                    onChange={(e) => {
                      const next = [...form.gallery];
                      next[i] = e.target.value;
                      setListString("gallery", next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setListString("gallery", form.gallery.filter((_, j) => j !== i))}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <h3 className="font-display text-xl font-light">Itinerary</h3>
        <div className="mt-4 flex flex-col gap-4">
          {form.itinerary.map((day, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-line p-4 md:grid-cols-12">
              <div className="md:col-span-1">
                <label className={label}>Day</label>
                <div className="pt-1.5 text-sm text-saffron">{i + 1}</div>
              </div>
              <div className="md:col-span-3">
                <label className={label}>Title</label>
                <input
                  className={field}
                  value={day.title}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, title: e.target.value };
                    set("itinerary", next);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Kind</label>
                <select
                  className={field}
                  value={day.kind}
                  onChange={(e) => {
                    updateKind(
                      i,
                      e.target.value as Expedition["itinerary"][number]["kind"],
                    );
                  }}
                >
                  {allKinds.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={label}>Altitude (m)</label>
                <input
                  type="number"
                  className={field}
                  value={day.altitudeM}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, altitudeM: Number(e.target.value) };
                    set("itinerary", next);
                  }}
                />
              </div>
              <div className="md:col-span-3">
                <label className={label}>Description</label>
                <input
                  className={field}
                  value={day.description}
                  onChange={(e) => {
                    const next = [...form.itinerary];
                    next[i] = { ...day, description: e.target.value };
                    set("itinerary", next);
                  }}
                />
              </div>
              <div className="flex items-end justify-end md:col-span-1">
                <button
                  type="button"
                  onClick={() => set("itinerary", form.itinerary.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <div className="border-t border-line/60 pt-3 md:col-span-12">
                <DayMap
                  from={day.from}
                  to={day.to}
                  single={day.kind === "acclimatization"}
                  onPlace={(which, patch) => updatePlace(i, which, patch)}
                />
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() =>
                set("itinerary", [
                  ...form.itinerary,
                  { ...form.itinerary, day: form.itinerary.length + 1, title: "", kind: "trek", altitudeM: 0, description: "", from: { name: "", lat: 0, lng: 0, kind: "village" }, to: { name: "", lat: 0, lng: 0, kind: "village" } },
                ])
              }
              className="text-xs text-saffron underline underline-offset-4 hover:text-snow"
            >
              + Add day
            </button>
          </div>
        </div>
      </div>

      {error && (
        <pre className="whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          {error}
        </pre>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-saffron px-6 py-3 text-sm font-medium text-night transition-all hover:bg-snow disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create expedition"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-mist underline underline-offset-4 hover:text-snow"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  placeholder,
  textarea,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div className={inputRow}>
      <label className={label}>{title}</label>
      {textarea ? (
        <textarea
          className={field}
          rows={Math.max(3, items.length)}
          placeholder={placeholder}
          value={items.join("\n")}
          onChange={(e) =>
            onChange(e.target.value.split("\n").map((s) => s.trim()))
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={field}
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...items, ""])}
            className="text-left text-xs text-saffron underline underline-offset-4 hover:text-snow"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `src/components/admin/ExpeditionForm.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ExpeditionForm.tsx
git commit -m "feat(expeditions): add ExpeditionForm admin component"
```

---

### Task 5: `ExpeditionManager.tsx` + admin dashboard wiring

**Files:**
- Create: `src/components/admin/ExpeditionManager.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin/AdminOverview.tsx`

**Interfaces:**
- Consumes: `ExpeditionForm` (Task 4), `Expedition` type (Task 2), `/api/expeditions` routes (Task 3).
- Produces: `<ExpeditionManager expeditions={...} onDelete={...} deleting={...} />` — wired into the admin page's new "Expeditions" tab.

- [ ] **Step 1: Write `ExpeditionManager.tsx` (mirrors `TrekManager.tsx`)**

```typescript
// src/components/admin/ExpeditionManager.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ExpeditionForm from "./ExpeditionForm";
import type { Expedition } from "@/data/expeditions";

const difficultyColor: Record<string, string> = {
  Moderate: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  Challenging: "bg-saffron/15 text-saffron border-saffron/25",
  Strenuous: "bg-red-400/15 text-red-300 border-red-400/25",
};

type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; expedition: Expedition };

export default function ExpeditionManager({
  expeditions,
  onDelete,
  deleting,
}: {
  expeditions: Expedition[] | null;
  onDelete: (expedition: Expedition) => void;
  deleting: string | null;
}) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("All");

  const filtered = (expeditions ?? []).filter((e) => {
    const matchesQuery =
      !query ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.region.toLowerCase().includes(query.toLowerCase()) ||
      e.summary.toLowerCase().includes(query.toLowerCase());
    const matchesDifficulty =
      difficulty === "All" || e.difficulty === difficulty;
    return matchesQuery && matchesDifficulty;
  });

  const saved = () => setMode({ kind: "list" });

  if (mode.kind === "new" || mode.kind === "edit") {
    return (
      <div className="mt-10">
        <ExpeditionForm
          initial={mode.kind === "edit" ? mode.expedition : null}
          onSaved={saved}
          onCancel={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search expeditions or regions…"
              className="w-full rounded-full border border-line-strong bg-night py-2.5 pl-9 pr-4 text-sm text-snow outline-none transition-colors placeholder:text-mist/60 focus:border-saffron"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", "Moderate", "Challenging", "Strenuous"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  difficulty === d
                    ? "border-saffron bg-saffron text-night"
                    : "border-line-strong text-mist hover:text-snow"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setMode({ kind: "new" })}
          className="w-fit rounded-full bg-saffron px-5 py-2.5 text-sm font-medium text-night transition-colors hover:bg-snow"
        >
          + New expedition
        </button>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-mist">
        {expeditions === null
          ? "Loading expeditions…"
          : `${filtered.length} of ${expeditions.length} expeditions`}
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {expeditions === null ? (
          <p className="text-sm text-mist">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-xl font-light text-snow">No expeditions found</p>
            <p className="mt-2 text-sm text-mist">
              Try a different search or difficulty filter.
            </p>
          </div>
        ) : (
          filtered.map((expedition) => (
            <div
              key={expedition.slug}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-night/40 p-4 sm:flex-row sm:items-center"
            >
              <img
                src={expedition.image}
                alt={expedition.name}
                className="h-20 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-32"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-light tracking-tight">
                    {expedition.name}
                  </h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${difficultyColor[expedition.difficulty]}`}
                  >
                    {expedition.difficulty}
                  </span>
                </div>
                <p className="mt-1 text-xs text-mist">
                  {expedition.region} · {expedition.durationDays} days ·{" "}
                  {expedition.peakHeightM.toLocaleString()} m peak
                </p>
                <p className="mt-1 truncate text-xs text-mist/70">{expedition.summary}</p>
                {expedition.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {expedition.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-mist"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                <Link
                  href={`/expeditions/${expedition.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-snow transition-colors hover:border-saffron hover:text-saffron"
                >
                  View
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => setMode({ kind: "edit", expedition })}
                    className="rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-snow transition-colors hover:border-saffron hover:text-saffron"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(expedition)}
                    disabled={deleting === expedition.slug}
                    className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-medium text-red-300 transition-colors hover:border-red-400 hover:text-red-200 disabled:opacity-50"
                  >
                    {deleting === expedition.slug ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the "Expeditions" tab into `src/app/admin/page.tsx`**

Modify `src/app/admin/page.tsx` — the changes below add expedition state/fetch/delete alongside the existing trek state, following the exact same pattern:

```typescript
// Add to imports at top:
import ExpeditionManager from "@/components/admin/ExpeditionManager";
import type { Expedition } from "@/data/expeditions";
```

```typescript
// Change:
type Tab = "overview" | "treks" | "gallery" | "inquiries";
// To:
type Tab = "overview" | "treks" | "expeditions" | "gallery" | "inquiries";
```

```typescript
// Change:
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "treks", label: "Treks" },
  { id: "gallery", label: "Gallery" },
  { id: "inquiries", label: "Inquiries" },
];
// To:
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "treks", label: "Treks" },
  { id: "expeditions", label: "Expeditions" },
  { id: "gallery", label: "Gallery" },
  { id: "inquiries", label: "Inquiries" },
];
```

```typescript
// Inside the component, add expedition state next to the existing trek state:
const [expeditions, setExpeditions] = useState<Expedition[] | null>(null);
const [deletingExpedition, setDeletingExpedition] = useState<string | null>(null);
const [confirmExpedition, setConfirmExpedition] = useState<Expedition | null>(null);
```

```typescript
// Add an expeditions refresh function next to `refresh`:
const refreshExpeditions = useCallback(async () => {
  const res = await fetch("/api/expeditions", { cache: "no-store" });
  const data = await res.json();
  if (res.ok && data.ok) setExpeditions(data.expeditions);
  else setError(data.error ?? "Failed to load expeditions");
}, []);
```

```typescript
// Inside the existing useEffect (alongside the treks and inquiries fetches), add:
fetch("/api/expeditions", { cache: "no-store" })
  .then((res) => res.json())
  .then((data) => {
    if (data && data.ok) setExpeditions(data.expeditions);
    else setError((data && data.error) ?? "Failed to load expeditions");
  })
  .catch(() => setError("Failed to load expeditions"));
```

```typescript
// Add an expedition delete handler next to onDeleteConfirmed:
async function onDeleteExpeditionConfirmed() {
  const expedition = confirmExpedition;
  if (!expedition) return;
  setDeletingExpedition(expedition.slug);
  setError(null);
  try {
    const res = await fetch(`/api/expeditions/${expedition.slug}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    setConfirmExpedition(null);
    await refreshExpeditions();
  } catch {
    setError("Delete failed");
  } finally {
    setDeletingExpedition(null);
  }
}
```

```typescript
// Add the tab panel, next to the existing "treks" tab panel:
{tab === "expeditions" && (
  <ExpeditionManager
    expeditions={expeditions}
    onDelete={(expedition) => setConfirmExpedition(expedition)}
    deleting={deletingExpedition}
  />
)}
```

```typescript
// Add a second ConfirmDialog instance, next to the existing one at the bottom of the returned JSX:
{confirmExpedition && (
  <ConfirmDialog
    title={`Delete "${confirmExpedition.name}"?`}
    message="This removes the expedition from the site and cannot be undone. The itinerary, gallery and route data for it will be lost."
    busy={deletingExpedition === confirmExpedition.slug}
    onConfirm={() => void onDeleteExpeditionConfirmed()}
    onCancel={() => setConfirmExpedition(null)}
  />
)}
```

- [ ] **Step 3: Add an expedition stat tile to `AdminOverview.tsx`**

Modify `src/components/admin/AdminOverview.tsx` to accept an optional `expeditionCount` prop and show it as a stat tile — add this to the `stats` array construction:

```typescript
// Change the function signature:
export default function AdminOverview({
  treks,
  newInquiryCount,
  expeditionCount,
  onNewTrek,
  onGallery,
}: {
  treks: Trek[] | null;
  newInquiryCount?: number;
  expeditionCount?: number;
  onNewTrek: () => void;
  onGallery: () => void;
}) {
```

```typescript
// Change the stats array to include expeditions right after treks:
const stats = [
  ...(newInquiryCount !== undefined
    ? [{ label: "New inquiries", value: String(newInquiryCount) }]
    : []),
  { label: "Treks", value: String(treks.length) },
  ...(expeditionCount !== undefined
    ? [{ label: "Expeditions", value: String(expeditionCount) }]
    : []),
  { label: "Regions", value: String(regions) },
  { label: "Trip days", value: String(totalDays) },
  {
    label: "Highest trek",
    value: `${highest?.maxAltitudeM?.toLocaleString() ?? "—"} m`,
    hint: highest?.name,
  },
];
```

Then in `src/app/admin/page.tsx`, pass the new prop where `AdminOverview` is rendered:

```typescript
// Change:
{tab === "overview" && (
  <AdminOverview
    treks={treks}
    newInquiryCount={newInquiryCount}
    onNewTrek={() => setTab("treks")}
    onGallery={() => setTab("gallery")}
  />
)}
// To:
{tab === "overview" && (
  <AdminOverview
    treks={treks}
    newInquiryCount={newInquiryCount}
    expeditionCount={expeditions?.length}
    onNewTrek={() => setTab("treks")}
    onGallery={() => setTab("gallery")}
  />
)}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run `npm run dev`, log into `/admin`, click the new "Expeditions" tab. Verify: the three seeded expeditions list, search/difficulty filters work, "+ New expedition" opens `ExpeditionForm`, editing and saving a field (e.g. changing Ama Dablam's `summitSuccessNotes`) round-trips correctly (reload the tab and confirm the change persisted), and the Overview tab now shows an "Expeditions" stat tile with count 3.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/ExpeditionManager.tsx src/app/admin/page.tsx src/components/admin/AdminOverview.tsx
git commit -m "feat(expeditions): wire ExpeditionManager into admin dashboard"
```

---

### Task 6: Widen shared trek-display components to accept `RouteContent`

**Files:**
- Modify: `src/components/trek/StageHero.tsx`
- Modify: `src/components/trek/TrekNav.tsx`
- Modify: `src/components/treks/TrekStage.tsx`
- Modify: `src/components/trek/StatsLedger.tsx`
- Modify: `src/components/trek/InquiryCTA.tsx`
- Modify: `src/components/trek/TrekStory.tsx`
- Modify: `src/components/trek/RouteMap.tsx`

**Interfaces:**
- Consumes: `RouteContent` type (Task 1).
- Produces: each component now accepts `trek: RouteContent` instead of `trek: Trek`; `StageHero`, `TrekNav`, `TrekStage` additionally accept an optional `basePath?: string` (default `"/treks"`) — consumed by Task 8's expedition detail page (which passes `basePath="/expeditions"`) and Task 7's expedition listing page.

This task is purely a widening — no behavioral change for existing trek pages. `Trek` (from `src/data/treks.ts`) already has every field `RouteContent` requires plus more, so passing a `Trek` value where `RouteContent` is expected type-checks with zero call-site changes on the existing `/treks` and `/treks/[slug]` pages.

- [ ] **Step 1: Widen `StageHero.tsx`**

Change the import and prop type, add `basePath`, and use it in the breadcrumb link:

```typescript
// Change:
import type { Trek } from "@/data/treks";
// To:
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change:
export default function StageHero({ trek }: { trek: Trek }) {
// To:
export default function StageHero({
  trek,
  basePath = "/treks",
  listLabel = "Treks",
}: {
  trek: RouteContent;
  basePath?: string;
  listLabel?: string;
}) {
```

```typescript
// Change:
<Link href="/treks" className="transition-colors hover:text-saffron">
  Treks
</Link>
// To:
<Link href={basePath} className="transition-colors hover:text-saffron">
  {listLabel}
</Link>
```

- [ ] **Step 2: Widen `TrekNav.tsx`**

```typescript
// Change:
import type { Trek } from "@/data/treks";
// To:
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change:
function TrekCard({
  trek,
  label,
  arrow,
}: {
  trek: Trek;
  label: string;
  arrow: "←" | "→";
}) {
// To:
function TrekCard({
  trek,
  label,
  arrow,
  basePath = "/treks",
}: {
  trek: RouteContent;
  label: string;
  arrow: "←" | "→";
  basePath?: string;
}) {
```

```typescript
// Change:
href={`/treks/${trek.slug}`}
// To:
href={`${basePath}/${trek.slug}`}
```

```typescript
// Change:
export default function TrekNav({ trek, all }: { trek: Trek; all: Trek[] }) {
  const idx = all.findIndex((t) => t.slug === trek.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div
      className={`grid gap-5 ${prev && next ? "sm:grid-cols-2" : ""}`}
    >
      {prev && <TrekCard trek={prev} label="Previous trek" arrow="←" />}
      {next && <TrekCard trek={next} label="Next trek" arrow="→" />}
    </div>
  );
}
// To:
export default function TrekNav({
  trek,
  all,
  basePath = "/treks",
}: {
  trek: RouteContent;
  all: RouteContent[];
  basePath?: string;
}) {
  const idx = all.findIndex((t) => t.slug === trek.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div
      className={`grid gap-5 ${prev && next ? "sm:grid-cols-2" : ""}`}
    >
      {prev && <TrekCard trek={prev} label="Previous trek" arrow="←" basePath={basePath} />}
      {next && <TrekCard trek={next} label="Next trek" arrow="→" basePath={basePath} />}
    </div>
  );
}
```

- [ ] **Step 3: Widen `TrekStage.tsx`**

```typescript
// Change:
import type { Trek } from "@/data/treks";
// To:
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change:
export default function TrekStage({
  trek,
  index,
  total,
}: {
  trek: Trek;
  index: number;
  total: number;
}) {
// To:
export default function TrekStage({
  trek,
  index,
  total,
  basePath = "/treks",
}: {
  trek: RouteContent;
  index: number;
  total: number;
  basePath?: string;
}) {
```

```typescript
// Change:
<Button href={`/treks/${trek.slug}`} size="lg">
// To:
<Button href={`${basePath}/${trek.slug}`} size="lg">
```

- [ ] **Step 4: Widen `StatsLedger.tsx`**

```typescript
// Change:
import type { ItineraryDay, Trek } from "@/data/treks";
// To:
import type { ItineraryDay } from "@/data/treks";
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change:
export default function StatsLedger({ trek }: { trek: Trek }) {
// To:
export default function StatsLedger({ trek }: { trek: RouteContent }) {
```

- [ ] **Step 5: Widen `InquiryCTA.tsx`**

```typescript
// Change:
import type { Trek } from "@/data/treks";
// To:
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change:
export default function InquiryCTA({ trek }: { trek: Trek }) {
// To:
export default function InquiryCTA({ trek }: { trek: RouteContent }) {
```

(The `/contact?trek=${trek.slug}` query param name stays `trek` for both content types — the contact page treats it as an opaque reference string, so no content-type distinction is needed there.)

- [ ] **Step 6: Widen `TrekStory.tsx`**

```typescript
// Change:
import type { ItineraryDay, Trek } from "@/data/treks";
// To:
import type { ItineraryDay } from "@/data/treks";
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change each of these three signatures (AltitudeRail, StageDay, TrekStory):
function AltitudeRail({ trek, active }: { trek: Trek; active: number }) {
// To:
function AltitudeRail({ trek, active }: { trek: RouteContent; active: number }) {
```

```typescript
// Change:
function StageDay({
  trek,
  day,
  index,
  total,
}: {
  trek: Trek;
  day: ItineraryDay;
  index: number;
  total: number;
}) {
// To:
function StageDay({
  trek,
  day,
  index,
  total,
}: {
  trek: RouteContent;
  day: ItineraryDay;
  index: number;
  total: number;
}) {
```

```typescript
// Change:
export default function TrekStory({ trek }: { trek: Trek }) {
// To:
export default function TrekStory({ trek }: { trek: RouteContent }) {
```

- [ ] **Step 7: Widen `RouteMap.tsx`**

```typescript
// Change:
import type { Trek } from "@/data/treks";
// To:
import type { RouteContent } from "@/lib/routeContent";
```

```typescript
// Change:
export default function RouteMap({
  trek,
  active = null,
  onSelect,
}: {
  trek: Trek;
  active?: number | null;
  onSelect?: (index: number) => void;
}) {
// To:
export default function RouteMap({
  trek,
  active = null,
  onSelect,
}: {
  trek: RouteContent;
  active?: number | null;
  onSelect?: (index: number) => void;
}) {
```

- [ ] **Step 8: Type-check and confirm zero behavior change on existing trek pages**

Run: `npx tsc --noEmit`
Expected: no errors — `Trek` values passed at every existing call site (`src/app/treks/page.tsx`, `src/app/treks/[slug]/page.tsx`, `src/components/treks/TrekFinder.tsx`) still satisfy `RouteContent` structurally.

Run: `npm run dev`, visit `/treks` and any `/treks/[slug]` page. Verify visually that nothing changed — hero, story scroll, stats, map sidebar, prev/next nav, and inquiry CTA all render exactly as before.

- [ ] **Step 9: Commit**

```bash
git add src/components/trek/StageHero.tsx src/components/trek/TrekNav.tsx src/components/treks/TrekStage.tsx src/components/trek/StatsLedger.tsx src/components/trek/InquiryCTA.tsx src/components/trek/TrekStory.tsx src/components/trek/RouteMap.tsx
git commit -m "refactor(trek): widen trek-detail components to accept RouteContent + basePath

Enables reuse for the new expeditions content type with zero behavior
change for existing trek pages (Trek is structurally a RouteContent)."
```

---

### Task 7: `ExpeditionFinder.tsx` + public `/expeditions` listing page

**Files:**
- Create: `src/components/expedition/ExpeditionFinder.tsx`
- Create: `src/app/expeditions/page.tsx`
- Modify: `src/data/site.ts`

**Interfaces:**
- Consumes: `Expedition`/`expeditionRegions`/`expeditionDifficulties` (Task 2), `TrekStage` widened with `basePath` (Task 6), `waLink` from `src/data/site.ts` (unmodified), `Button`/`cn` (unmodified).
- Produces: `<ExpeditionFinder expeditions={Expedition[]} />`, the `/expeditions` route.

`ExpeditionFinder` mirrors `TrekFinder.tsx` structurally but drops the region/difficulty/duration module-constant imports in favor of props (since expeditions don't share `treks.ts`'s `regions`/`difficulties` constants) and passes `basePath="/expeditions"` down to `TrekStage`.

- [ ] **Step 1: Write `ExpeditionFinder.tsx`**

```typescript
// src/components/expedition/ExpeditionFinder.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import TrekStage from "@/components/treks/TrekStage";
import type { Difficulty, Expedition } from "@/data/expeditions";
import { waLink } from "@/data/site";
import { cn } from "@/lib/utils";

const durationFilters = [
  { id: "any", label: "Any length", test: () => true },
  { id: "week", label: "Up to 7 days", test: (d: number) => d <= 7 },
  { id: "classic", label: "8–10 days", test: (d: number) => d >= 8 && d <= 10 },
  { id: "epic", label: "10+ days", test: (d: number) => d > 10 },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-wide whitespace-nowrap transition-colors duration-200",
        active
          ? "border-saffron bg-saffron text-night"
          : "border-line text-mist hover:border-line-strong hover:text-snow",
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:gap-2.5">
      <span className="flex items-center gap-2.5">
        <span className="hidden text-[10px] uppercase tracking-[0.18em] text-mist/70 xl:inline">
          {label}
        </span>
        <span className="h-px w-6 bg-saffron/40 xl:hidden" aria-hidden />
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:flex-wrap xl:overflow-visible xl:pb-0">
        {children}
      </div>
    </div>
  );
}

export default function ExpeditionFinder({ expeditions }: { expeditions: Expedition[] }) {
  const regions = useMemo(() => [...new Set(expeditions.map((e) => e.region))], [expeditions]);
  const difficulties: Difficulty[] = ["Moderate", "Challenging", "Strenuous"];

  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [duration, setDuration] = useState("any");
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 4) {
        setHidden(delta > 0 && y > 120);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasFilters =
    activeRegions.length > 0 || difficulty !== null || duration !== "any";

  const filtered = useMemo(() => {
    const durationTest =
      durationFilters.find((f) => f.id === duration)?.test ??
      durationFilters[0].test;
    return expeditions.filter((expedition) => {
      if (
        activeRegions.length > 0 &&
        !activeRegions.some((r) => expedition.region.includes(r))
      ) {
        return false;
      }
      if (difficulty && expedition.difficulty !== difficulty) return false;
      if (!durationTest(expedition.durationDays)) return false;
      return true;
    });
  }, [expeditions, activeRegions, difficulty, duration]);

  const toggleRegion = (region: string) =>
    setActiveRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region],
    );

  const reset = () => {
    setActiveRegions([]);
    setDifficulty(null);
    setDuration("any");
  };

  return (
    <div>
      <div
        className={cn(
          "sticky top-16 z-40 border-y border-line bg-night/85 backdrop-blur-md transition-transform duration-300 md:top-26",
          hidden && "-translate-y-[calc(100%+1px)]",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-x-8 gap-y-3 px-5 py-3.5 md:px-8 xl:flex-row xl:flex-wrap xl:items-center">
          <FilterGroup label="Region">
            {regions.map((region) => (
              <Chip
                key={region}
                active={activeRegions.includes(region)}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Difficulty">
            {difficulties.map((d) => (
              <Chip
                key={d}
                active={difficulty === d}
                onClick={() => setDifficulty((prev) => (prev === d ? null : d))}
              >
                {d}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Duration">
            {durationFilters.map((f) => (
              <Chip
                key={f.id}
                active={duration === f.id}
                onClick={() => setDuration(f.id)}
              >
                {f.label}
              </Chip>
            ))}
          </FilterGroup>

          <div className="ml-auto flex items-center gap-4">
            <span
              className="text-[11px] text-mist"
              role="status"
              aria-live="polite"
            >
              {filtered.length} of {expeditions.length}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] text-saffron underline underline-offset-4 transition-colors hover:text-snow"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8">
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-3xl font-light">
              No expedition matches that combination.
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-mist">
              That usually means a custom climb. Tell Abishek what peak
              you&apos;re dreaming of — he&apos;s probably guided it.
            </p>
            <Button
              href={waLink(
                "Hi Abishek! I'm looking for a peak expedition that isn't listed on the site. Can we design a custom climb?",
              )}
              external
            >
              Ask for a custom climb
            </Button>
          </div>
        </div>
      ) : (
        <div className="snap-y snap-proximity">
          {filtered.map((expedition) => (
            <TrekStage
              key={expedition.slug}
              trek={expedition}
              index={expeditions.indexOf(expedition)}
              total={filtered.length}
              basePath="/expeditions"
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write the `/expeditions` listing page (mirrors `src/app/treks/page.tsx`)**

```typescript
// src/app/expeditions/page.tsx
import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import ExpeditionFinder from "@/components/expedition/ExpeditionFinder";
import Marquee from "@/components/ui/Marquee";
import { expeditions } from "@/data/expeditions";
import { formatAltitude } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Expeditions",
  description:
    "Sherpa-guided peak expeditions across Nepal — from Island Peak's glacier walk to the technical ridges of Ama Dablam and remote Mt Himlung.",
};

export default function ExpeditionsPage() {
  const regions = new Set(
    expeditions.flatMap((e) => e.region.split(",").map((r) => r.trim())),
  );
  const maxAlt = Math.max(...expeditions.map((e) => e.peakHeightM));
  const stats = [
    { value: String(expeditions.length), label: "expeditions" },
    { value: String(regions.size), label: "regions" },
    { value: formatAltitude(maxAlt), label: "highest summit" },
  ];

  return (
    <>
      <section className="photo-dark relative overflow-hidden border-b border-line">
        <img
          src="/images/scenes/glacier.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="photo-scrim-v absolute inset-0"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-5 pt-36 pb-16 md:px-8 md:pt-44 md:pb-20">
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-eyebrow text-saffron">
              <span className="h-px w-10 bg-saffron" aria-hidden />
              All {expeditions.length} expeditions
            </p>
            <h1 className="max-w-4xl font-display text-5xl leading-[0.98] font-light tracking-tight text-balance md:text-7xl lg:text-8xl">
              Climb where the air runs{" "}
              <em className="text-gradient not-italic">thin.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-snow/80 md:text-lg">
              Guided peak climbs from trekking-peak first summits to
              technical 7,000m objectives. Filter by region, difficulty
              and time.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <span className="font-display text-3xl font-light text-saffron md:text-4xl">
                    {stat.value}
                  </span>
                  <span className="ml-3 text-xs uppercase tracking-[0.18em] text-mist">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <Marquee />
      <ExpeditionFinder expeditions={expeditions} />
    </>
  );
}
```

- [ ] **Step 3: Add the nav entry in `src/data/site.ts`**

```typescript
// Change:
nav: [
  { href: "/treks", label: "Treks" },
  { href: "/gallery", label: "Gallery" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
],
// To:
nav: [
  { href: "/treks", label: "Treks" },
  { href: "/expeditions", label: "Expeditions" },
  { href: "/gallery", label: "Gallery" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
],
```

- [ ] **Step 4: Type-check and manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run `npm run dev`, visit `/expeditions`. Verify: hero renders, the three expeditions scroll through `TrekStage` panels, region/difficulty/duration filters work, "Explore this trek" buttons link to `/expeditions/<slug>` (these 404 until Task 8 — that's expected at this point), and the top nav now shows an "Expeditions" link.

- [ ] **Step 5: Commit**

```bash
git add src/components/expedition/ExpeditionFinder.tsx src/app/expeditions/page.tsx src/data/site.ts
git commit -m "feat(expeditions): add /expeditions listing page and nav entry"
```

---

### Task 8: Public `/expeditions/[slug]` detail page

**Files:**
- Create: `src/app/expeditions/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getExpedition`/`expeditions` (Task 2), `StageHero`/`TrekStory`/`StatsLedger`/`TrekNav`/`InquiryCTA` widened with `basePath` (Task 6), `ElevationProfile`/`Gallery` (unmodified, already generic).

This mirrors `src/app/treks/[slug]/page.tsx` exactly, swapping the data source and passing `basePath="/expeditions"` to the three components that need it.

- [ ] **Step 1: Write the detail page**

```typescript
// src/app/expeditions/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ElevationProfile from "@/components/trek/ElevationProfile";
import Gallery from "@/components/trek/Gallery";
import InquiryCTA from "@/components/trek/InquiryCTA";
import StageHero from "@/components/trek/StageHero";
import StatsLedger from "@/components/trek/StatsLedger";
import TrekNav from "@/components/trek/TrekNav";
import TrekStory from "@/components/trek/TrekStory";
import { getExpedition, expeditions } from "@/data/expeditions";

export function generateStaticParams() {
  return expeditions.map((expedition) => ({ slug: expedition.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const expedition = getExpedition(slug);
  if (!expedition) return {};
  return { title: expedition.name, description: expedition.summary };
}

export default async function ExpeditionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expedition = getExpedition(slug);
  if (!expedition) notFound();

  return (
    <>
      <StageHero trek={expedition} basePath="/expeditions" listLabel="Expeditions" />
      <TrekStory trek={expedition} />

      <section className="border-y border-line">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="mb-12">
            <SectionHeading
              eyebrow="Elevation"
              title="How the days climb."
              description="Hover the profile to see each day — conservative ascent, acclimatization built in."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ElevationProfile itinerary={expedition.itinerary} />
          </Reveal>
        </div>
      </section>

      <StatsLedger trek={expedition} />

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="mb-14">
          <SectionHeading
            eyebrow="Scenes"
            title={`What a ${expedition.region.split(",")[0]} day looks like.`}
          />
        </Reveal>
        <Gallery images={expedition.gallery} name={expedition.name} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8 md:pb-32">
        <Reveal>
          <div className="mb-16">
            <SectionHeading
              eyebrow="More expeditions"
              title="Keep exploring."
              className="mb-10"
            />
            <TrekNav trek={expedition} all={expeditions} basePath="/expeditions" />
          </div>
        </Reveal>
        <InquiryCTA trek={expedition} />
      </section>
    </>
  );
}
```

- [ ] **Step 2: Run typegen and type-check**

Run: `npx next typegen && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build and manually verify**

Run: `npm run build`
Expected: build succeeds, and the output lists `/expeditions/mt-himlung`, `/expeditions/ama-dablam`, `/expeditions/island-peak` as statically generated routes (from `generateStaticParams`).

Run `npm run dev`, visit `/expeditions/ama-dablam`. Verify: hero renders with "Expeditions" breadcrumb linking back to `/expeditions`, the day-by-day scroll story works with the route map sidebar showing on desktop, elevation profile renders, stats ledger renders, gallery renders, prev/next expedition nav links to `/expeditions/<slug>` (not `/treks/<slug>`), and the WhatsApp/inquiry CTA references "Ama Dablam Expedition" by name.

- [ ] **Step 4: Commit**

```bash
git add src/app/expeditions/[slug]/page.tsx
git commit -m "feat(expeditions): add /expeditions/[slug] detail page"
```

---

### Task 9: Full verification pass and branch completion

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including `expeditionSchema.test.ts` and `expeditionStore.test.ts` from Tasks 1–2.

- [ ] **Step 2: Run the full type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Full production build**

Run: `npm run build`
Expected: succeeds, with both `/treks/*` and `/expeditions/*` routes statically generated.

- [ ] **Step 4: End-to-end admin walkthrough**

With `npm run dev` running and logged into `/admin`:
1. Create a new expedition from scratch via the "+ New expedition" button, fill in all fields including at least 2 itinerary days with the `DayMap` picker, upload or paste an image URL, save — confirm it appears in the list and on the public `/expeditions` page after refresh.
2. Edit one of the three seeded expeditions (e.g. change Island Peak's `permitCostUSD`), save, confirm the public detail page reflects the change.
3. Delete the test expedition created in step 1, confirm it disappears from both admin and public listing.
4. Confirm the Overview tab's "Expeditions" stat tile count matches the current expedition count throughout.

- [ ] **Step 5: Mobile viewport spot-check**

Resize the browser (or use dev tools device emulation) to a ~375px mobile width. Visit `/expeditions`, an expedition detail page, and the admin "Expeditions" tab. Confirm: filter chips scroll horizontally without breaking layout, the `ExpeditionForm` fields stack in a single column, and no horizontal overflow occurs anywhere. (Full mobile-UI polish is Phase 3's scope — this is a smoke check, not a redesign pass.)

- [ ] **Step 6: Complete the branch**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."
**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch

## Self-review notes (already applied above)

- **Spec coverage:** goal #2 ("Add a 'peak expedition' content type... with full admin CRUD") is covered by Tasks 1–5; goal #3's "admin can edit anything editorially important" is satisfied for expeditions specifically by this plan (site-settings editability is Phase 4's separate scope, already noted in the design doc); goal #4 ("route map on every... expedition detail page") is covered by Task 8 reusing the already-map-wired `TrekStory`; goal #5 (mobile-first pass) gets a smoke check in Task 9 Step 5, with the full audit correctly deferred to Phase 3 per the design doc's phase breakdown — not silently dropped.
- **Known, documented gap carried into Phase 3 (not a defect):** `src/data/dayViews.ts` (`dayPlaces`/`trekLabels`/`trailWaypoints`) and `src/data/trekPhotos.ts` are slug-keyed to treks only. For expedition slugs, `TrekStory.tsx`'s route-info line falls back to `"—"` and per-day photos simply don't render (both paths already null-safe, verified by reading the consuming code directly) — expeditions get a fully working flythrough map off raw `path`/`coordinates`, just without hand-authored scenic waypoint labels or curated per-day photos until Phase 3 generalizes those lookups for any content type.
- **Type consistency check:** `RouteContent` (Task 1) field names match exactly what Task 6's widened components read (verified against each component's actual source in this plan's research phase); `Expedition` (Task 2) and the `expeditionSchema` (Task 1) field lists match 1:1; `ExpeditionForm`'s `FormState`/`emptyExpedition` (Task 4) match `Expedition`'s fields exactly, mirroring `TrekForm`'s pattern field-for-field.
- **No placeholders:** every step above contains complete, copy-pasteable code — no "TODO", no "similar to Task N" without the actual code included.
