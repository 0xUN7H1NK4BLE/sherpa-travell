# 3D Visual Redesign Design

> Companion to `docs/superpowers/specs/2026-08-12-travel-platform-upgrade-design.md`. This spec covers only the public-site visual/3D pass — it does not touch the DB, inquiries, expeditions data model, or admin CRUD work covered by the other phases.

**Goal:** Give the public site (home, trek/expedition listings and detail pages, About, Contact, gallery) a more professional, visually distinctive look by introducing real WebGL 3D graphics — literal terrain scenes on major heroes, abstract geometric/particle accents everywhere else — without regressing the mobile-responsiveness work just completed or degrading on low-end devices.

**Architecture:** A small shared `src/components/three/` library built on React Three Fiber (R3F) + drei, composed the same way the codebase already composes map components: client-only, lazy-loaded via `next/dynamic({ ssr: false })`, themed off the existing CSS custom properties in `globals.css` rather than a new palette. Every 3D component ships with a non-WebGL, non-JS-blocking fallback so the page is never broken by it.

**Tech Stack:** `three`, `@react-three/fiber`, `@react-three/drei` (new dependencies). No other new runtime dependencies.

## Global Constraints

- Public site only. Admin (`src/components/admin/**`) is out of scope — untouched.
- Every 3D component must be dynamically imported with `ssr: false`, matching the existing pattern at `src/components/trek/TrekStory.tsx:13` for `RouteMap`. No 3D code may execute during SSR or block the initial HTML.
- Must respect `prefers-reduced-motion: reduce` — matches the existing pattern already used for `.aurora-bg` and `.marquee-track` in `src/app/globals.css:174-179` and `:376-380`. Reduced-motion means no camera drift, no particle animation, no auto-rotation — a static frame or the pre-3D fallback.
- Must degrade gracefully with no WebGL support or a canvas context failure: fall back to the current 2D gradient/photo hero. Never a blank canvas or a thrown error.
- Materials, lighting colors, and fog must be derived from the existing design tokens (`--accent`, `--accent-strong`, `--accent-ice`, `--bg`, `--ink`) in `src/app/globals.css:21-48`, not a new hardcoded palette — so the 3D layer stays theme-consistent between the dark (`night`) and light themes already defined there.
- Terrain shapes are procedural approximations (peak count/height driven by a trek's data), not licensed or surveyed GIS terrain. Do not claim geographic accuracy anywhere in UI copy.
- No new dependency beyond `three`, `@react-three/fiber`, `@react-three/drei`.

---

## Components

### `src/components/three/Scene3DBoundary.tsx`
Shared wrapper every 3D component renders through. Owns the three degradation checks so individual scenes don't reimplement them:
1. **SSR/mount guard** — renders nothing (or a passed `fallback` node) until mounted client-side. Combined with the outer `next/dynamic({ ssr:false })`, this is belt-and-suspenders against any SSR execution.
2. **`prefers-reduced-motion` read** — exposes a `reducedMotion: boolean` via a small hook (`useReducedMotion`, a `matchMedia` listener) so child scenes can skip animation loops without a separate check per component.
3. **WebGL availability + error boundary** — attempts a throwaway `WebGLRenderingContext` probe once; if unavailable, or if the R3F `<Canvas>` throws during mount (caught via a React error boundary), renders `fallback` instead of the 3D content.

Consumes: nothing external.
Produces: `<Scene3DBoundary fallback={<CurrentHeroMarkup />}>{children}</Scene3DBoundary>`, and the `useReducedMotion()` hook for scenes that need to brance internally instead of unmounting entirely (e.g. keep static terrain visible but stop camera drift).

### `src/components/three/TerrainScene.tsx`
Literal mountain/ridgeline scene for major heroes. Procedural geometry: a displaced plane or low-poly ridge mesh, peak height/silhouette seeded from a `maxAltitudeM`-like number so different treks/expeditions get visually distinct (not identical) scenes without hand-authored models. Lighting: one directional "sun" light + ambient fill, both colored from the theme tokens. Optional slow camera drift (disabled under reduced motion).

Props: `{ seed: number; peakAltitudeM?: number; className?: string }`.

Used by: home hero (`src/components/home/Hero.tsx`), trek detail hero (`src/components/trek/StageHero.tsx`), expedition detail hero (`src/components/treks/TrekStage.tsx`).

### `src/components/three/AbstractAccent.tsx`
Smaller decorative scene for cards and section dividers: a handful of floating low-poly/glass-shard shapes or a light particle drift, sized to sit behind or beside content rather than as a full hero. Much lower geometry/particle budget than `TerrainScene` — this runs many-at-once on listing pages, so cost per instance must stay small.

Props: `{ variant: "shards" | "particles"; density?: "low" | "high"; className?: string }`.

Used by: trek/expedition listing cards, gallery section, About/Contact section dividers.

### Interfaces (for the later plan)
- `Scene3DBoundary` is a dependency of both `TerrainScene` and `AbstractAccent` — it must exist and be tested before either scene component is built.
- `TerrainScene` and `AbstractAccent` are independent of each other and can be built in parallel once `Scene3DBoundary` exists.
- Page-level integration (swapping heroes/cards to use these components) is a separate concern from building the components themselves — the plan should split "build the 3D component library" from "wire it into page N."

---

## Data flow

No new data sources. `TerrainScene`'s `seed`/`peakAltitudeM` props are derived at the call site from data that already exists (e.g. a trek's itinerary max elevation, or a stable hash of its slug if no elevation field is convenient) — purely presentational, nothing persisted, nothing round-tripped through the DB or admin.

---

## Error handling / degradation (expanded from Global Constraints)

This is the section most load-bearing for not regressing the mobile pass just finished:

- **Reduced motion:** `useReducedMotion()` freezes camera drift and particle motion; geometry still renders, just static. No opt-out needed from users beyond the OS-level setting already respected elsewhere in this codebase.
- **No WebGL / context creation throws:** `Scene3DBoundary`'s error boundary + capability probe swaps in `fallback`, which for every hero is simply *the current, already-shipped* 2D markup for that section (not new fallback art) — this guarantees zero net-new design work for the failure path and zero risk of a novel bug in code nobody exercises during normal QA.
- **Low-end / mobile devices:** two levers, applied at the scene level, not the boundary level (boundary only knows on/off): pixel ratio capped (`Math.min(devicePixelRatio, 2)` is standard for R3F, applies as-is), and `AbstractAccent`'s `density` prop set to `"low"` below a viewport-width breakpoint matching the existing `sm:`/`lg:` breakpoints already used throughout the mobile pass (`DayMap.tsx`, `TrekStory.tsx`). `TerrainScene` on mobile drops the optional camera drift regardless of motion preference, to save a render loop on constrained devices.
- **Bundle weight:** `next/dynamic({ ssr:false })` per component (not one shared chunk for the whole `three/` library) so a page using only `AbstractAccent` never pulls `TerrainScene`'s code, and vice versa.

---

## Testing

WebGL scenes have no meaningful jsdom/unit-test surface (no real canvas/GPU in CI). Verification strategy:

- **Unit-testable logic only:** `useReducedMotion()`'s `matchMedia` branching, and `Scene3DBoundary`'s fallback-on-no-WebGL branch (mock `WebGLRenderingContext` absence), get real `node:test` coverage — these are plain functions/conditionals, not rendering.
- **Build/typecheck:** `npm run build` and `npx tsc --noEmit` must stay clean with the new components integrated, confirming SSR isn't broken and the dynamic-import boundary is correctly typed.
- **Manual/source verification per page:** as established during the mobile pass (no browser automation available in this environment), verify via source read that each integration point correctly wraps its 3D component in `next/dynamic({ ssr:false })` and passes a real fallback matching the pre-existing markup for that section.
- **No snapshot testing of rendered 3D output** — out of scope, low value for procedural/animated content.

---

## Implementation phasing (for the plan)

1. **Foundation:** install deps, build `Scene3DBoundary` + `useReducedMotion`, unit tests for both.
2. **`TerrainScene`** component + integration into home hero, trek detail hero, expedition detail hero (three integration points, one component).
3. **`AbstractAccent`** component + integration into listing cards and section dividers.

Each phase is independently shippable and testable — matches this codebase's existing subagent-driven-development task granularity.
