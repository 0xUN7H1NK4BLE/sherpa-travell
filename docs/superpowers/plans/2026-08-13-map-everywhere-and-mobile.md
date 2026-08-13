# Map Everywhere + Mobile UI Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the route map (`RouteMap.tsx`, embedded via `TrekStory.tsx`) show real place markers and named waypoints for expeditions, not just treks, without hand-authoring per-slug data — then fix the two real mobile-usability gaps a full responsive audit found in the admin `DayMap` place-picker.

**Architecture:** `src/data/dayViews.ts` currently derives `dayPlaces` and `trekLabels` only from `treks`, keyed by trek slug. `RouteMap.tsx` and `TrekStory.tsx` already accept the generic `RouteContent` type and are already wired into `/expeditions/[slug]` (via the shared `TrekStory` component) — so no new wiring code is needed there. The only gap is that `dayViews.ts`'s lookups return `undefined` for expedition slugs, so expedition pages silently get an empty route panel (no place markers, "—" for the from/to line, straight-line camera flights instead of curved trail waypoints). Widening the two derived lookups to iterate `[...treks, ...expeditions]` closes this gap using data every expedition already carries (itinerary `from`/`to` places with name/lat/lng/kind) — no hand-authored `scenicLabels`/`trailWaypoints` entries required for expeditions to work correctly, matching the design spec's explicit requirement.

A full mobile-breakpoint (375–428px) audit of the public site and admin UI found the codebase already responsive almost everywhere (consistent `grid-cols-1` → `sm:`/`md:`/`lg:` bump patterns, wrapping chip rows, stacking cards). The only real gaps are both in `src/components/admin/DayMap.tsx`: the search/target-toggle overlay sits on top of a 224px-tall map on narrow screens, eating most of the visible map before drag-to-place is usable, and Leaflet's default zoom buttons are under the 44px touch-target guideline.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, Leaflet (admin `DayMap`), Google Maps JS API (public `RouteMap`), Node's built-in test runner (`node --import tsx --test`).

## Global Constraints

- No new dependencies.
- Test command: `npm test` (runs `node --import tsx --test src/**/*.test.ts`).
- Zero behavior change for existing trek slugs — `dayPlaces[slug]` and `trekLabels[slug]` values for every trek must stay byte-identical to before this plan.
- No browser-automation tooling is available in this environment; manual/mobile verification steps are executed via dev-server + curl/source-level checks (matches the pattern already used for Phase 2's verification pass), not real device emulation.
- `RouteMap.tsx`'s desktop-only route panel (`hidden ... lg:flex` in `TrekStory.tsx`) is out of scope to make mobile-visible — that's a new layout feature, not part of this plan. Only the admin `DayMap.tsx` touch-target/layout gaps (which are reachable on mobile today) are in scope.

---

### Task 1: Generalize `dayViews.ts` to cover expeditions

**Files:**
- Modify: `src/data/dayViews.ts`
- Test: `src/data/dayViews.test.ts` (new)

**Interfaces:**
- Consumes: `treks` from `@/data/treks`, `expeditions` from `@/data/expeditions`, both already exposing `.slug: string` and `.itinerary: ItineraryDay[]` (identical `ItineraryDay`/`Place` shape, `Expedition` reuses the type from `treks.ts`).
- Produces: `dayPlaces: Record<string, DayPlace[]>` and `trekLabels: Record<string, PlaceLabel[]>` now keyed by every trek slug AND every expedition slug (unchanged export names/shapes — `RouteMap.tsx` and `TrekStory.tsx` need no changes).

- [ ] **Step 1: Write the failing test**

Create `src/data/dayViews.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `dayPlaces["ama-dablam"]` etc. are `undefined` (only trek slugs exist today), so `assert.ok` calls throw.

- [ ] **Step 3: Widen the derivation to include expeditions**

In `src/data/dayViews.ts`, add the import and a combined-source list, then change `dayPlaces` and `trekLabels` to map over it instead of `treks` alone.

Change the top imports from:

```typescript
import { treks } from "@/data/treks";
import type { Trek } from "@/data/treks";
```

to:

```typescript
import { treks } from "@/data/treks";
import { expeditions } from "@/data/expeditions";
import type { ItineraryDay } from "@/data/treks";

interface RouteLike {
  slug: string;
  itinerary: ItineraryDay[];
}

const allRoutes: RouteLike[] = [...treks, ...expeditions];
```

Then change the `dayPlaces` export from:

```typescript
export const dayPlaces: Record<string, DayPlace[]> = Object.fromEntries(
  treks.map((t: Trek) => [
    t.slug,
    t.itinerary.map((d) => ({
      from: d.from.name,
      to: d.to.name,
    })),
  ]),
);
```

to:

```typescript
export const dayPlaces: Record<string, DayPlace[]> = Object.fromEntries(
  allRoutes.map((t) => [
    t.slug,
    t.itinerary.map((d) => ({
      from: d.from.name,
      to: d.to.name,
    })),
  ]),
);
```

And change the `trekLabels` export from:

```typescript
export const trekLabels: Record<string, PlaceLabel[]> = Object.fromEntries(
  treks.map((t: Trek) => {
    const map = new Map<string, PlaceLabel>();
    for (const d of t.itinerary) {
      for (const p of [d.from, d.to]) {
        if (p && p.name && !map.has(p.name)) {
          map.set(p.name, { name: p.name, lat: p.lat, lng: p.lng, kind: p.kind });
        }
      }
    }
    for (const p of scenicLabels[t.slug] ?? []) {
      if (!map.has(p.name)) map.set(p.name, p);
    }
    return [t.slug, [...map.values()]];
  }),
);
```

to:

```typescript
export const trekLabels: Record<string, PlaceLabel[]> = Object.fromEntries(
  allRoutes.map((t) => {
    const map = new Map<string, PlaceLabel>();
    for (const d of t.itinerary) {
      for (const p of [d.from, d.to]) {
        if (p && p.name && !map.has(p.name)) {
          map.set(p.name, { name: p.name, lat: p.lat, lng: p.lng, kind: p.kind });
        }
      }
    }
    for (const p of scenicLabels[t.slug] ?? []) {
      if (!map.has(p.name)) map.set(p.name, p);
    }
    return [t.slug, [...map.values()]];
  }),
);
```

(Only the source array changed, `treks.map((t: Trek) => ...)` → `allRoutes.map((t) => ...)` — the function bodies are untouched, so trek output is byte-identical.)

Leave `scenicLabels` and `trailWaypoints` untouched — they stay trek-only hand-authored enrichment. Expeditions fall through to `scenicLabels[t.slug] ?? []` (empty, since no expedition key exists) and `RouteMap.tsx`'s existing `trailWaypoints[trek.slug] ?? []` (also empty for expeditions) — both already have safe fallbacks, so expeditions get correct-but-unenriched maps (itinerary-derived markers, straight-line camera flight between days) with zero new hand-authored data required.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `dayViews.test.ts` tests green, plus every pre-existing test still green (except the pre-existing, out-of-scope `inquiryStore.test.ts` DB-connection failure already documented as environment-only).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/dayViews.ts src/data/dayViews.test.ts
git commit -m "feat(map): generalize dayViews lookups to cover expeditions"
```

---

### Task 2: Fix mobile layout gaps in admin `DayMap`

**Files:**
- Modify: `src/components/admin/DayMap.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing new — purely layout/CSS changes to an existing component and its global stylesheet.
- Produces: nothing new consumed elsewhere — `DayMap`'s props/behavior are unchanged.

- [ ] **Step 1: Move the search/target overlay off the map at mobile widths**

In `src/components/admin/DayMap.tsx`, find the overlay wrapper (currently around line 293):

```typescript
        <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-1.5 sm:right-auto sm:w-72">
```

Replace with:

```typescript
        <div className="static mb-2 flex flex-col gap-1.5 sm:absolute sm:left-3 sm:right-auto sm:top-3 sm:z-[1000] sm:mb-0 sm:w-72">
```

This makes the target-toggle pills + search input a normal block sitting above the map on narrow screens (base breakpoint, `static`, `mb-2` for spacing), and restores today's floating-overlay behavior at `sm:` (640px) and up — unchanged from current desktop/tablet appearance.

- [ ] **Step 2: Give the map more height on mobile**

In the same file, find the map container div (currently around line 361):

```typescript
        <div ref={containerRef} className="h-56 w-full rounded-lg border border-line" />
```

Replace with:

```typescript
        <div ref={containerRef} className="h-72 w-full rounded-lg border border-line sm:h-56" />
```

Base breakpoint gets a taller 288px (`h-72`) map now that the overlay no longer covers it; `sm:` and up keeps the existing 224px (`h-56`) height, unchanged from today.

- [ ] **Step 3: Bump Leaflet's zoom-control touch targets on mobile**

In `src/app/globals.css`, after the existing block:

```css
.leaflet-bar a:hover {
  background: var(--bg-overlay);
  color: var(--accent);
}
```

Add:

```css
@media (max-width: 639px) {
  .leaflet-bar a {
    width: 44px;
    height: 44px;
    line-height: 44px;
  }
}
```

This only affects `.leaflet-bar a` (Leaflet's zoom in/out control, the only Leaflet usage in the codebase — `RouteMap.tsx` uses Google Maps, a separate control implementation), and only below the `sm` breakpoint (639px), leaving desktop/tablet sizing untouched.

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/DayMap.tsx src/app/globals.css
git commit -m "fix(admin): fix DayMap mobile overlay overlap and touch-target sizing"
```

---

### Task 3: Full verification pass

**Files:** none created or modified — this task only runs checks.

**Interfaces:**
- Consumes: everything from Tasks 1-2.
- Produces: nothing — terminal task for this plan.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass except the pre-existing, documented, out-of-scope `inquiryStore.test.ts` DB-connection-string failure (no live Postgres in this environment).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: build succeeds, including `/expeditions/[slug]` and `/treks/[slug]` static params.

- [ ] **Step 5: Manual verification — expedition map data**

Start the dev server (`npm run dev`), then confirm via a quick Node check that Ama Dablam's route now resolves real place data (this doubles as smoke-testing the built output, not just the unit test from Task 1):

```bash
node --import tsx -e "
import { dayPlaces, trekLabels } from './src/data/dayViews.ts';
console.log('dayPlaces[ama-dablam][0]:', dayPlaces['ama-dablam']?.[0]);
console.log('trekLabels[ama-dablam].length:', trekLabels['ama-dablam']?.length);
"
```

Expected: `dayPlaces['ama-dablam'][0]` prints a real `{ from, to }` pair (not `undefined`), and `trekLabels['ama-dablam'].length` is greater than 0.

- [ ] **Step 6: Manual verification — DayMap mobile layout**

With the dev server running, open `/admin` in a browser, open the trek or expedition form's itinerary editor for any day, and use devtools responsive mode to set the viewport to 375×667:
- Confirm the search input and "Set 1 · from" / "Set 2 · to" pills appear stacked above the map (not overlapping it).
- Confirm the map itself is visibly taller than before (roughly 288px vs the old 224px).
- Confirm the Leaflet zoom +/− buttons are large enough to tap comfortably (visually ~44px square, not the old ~26px).

Then widen back to desktop (≥1024px) and confirm the overlay returns to floating over the top-left of the map exactly as before this plan (no visual regression at existing breakpoints).

- [ ] **Step 7: Confirm no regression to existing trek behavior**

```bash
git diff main --stat
```

Expected: only `src/data/dayViews.ts`, `src/data/dayViews.test.ts`, `src/components/admin/DayMap.tsx`, `src/app/globals.css` (plus this plan doc) changed since branching — no unrelated files touched.

- [ ] **Step 8: Announce and hand off to branch completion**

Announce: "I'm using the finishing-a-development-branch skill to complete this work."
**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch. Follow that skill to verify tests, present options, execute choice.
