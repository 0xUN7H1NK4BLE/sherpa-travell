# Fast-Loading Map Previews — Design

## Problem

All three map mount points on the site — the homepage teaser (`MapTeaser.tsx`), the `/map` explorer (`MapExplorer.tsx`), and the trek/expedition detail sidebar (`TrekStory.tsx`) — load their map component with `dynamic(..., { ssr: false, loading: () => <div className="map-skeleton" /> })`. Nothing renders server-side, so every visitor sees a blank placeholder for however long it takes the client map JS and first tiles to arrive.

Separately, `RouteMap.tsx` (the trek/expedition detail map) runs a decorative "warm-up" camera animation on every mount (`src/components/trek/RouteMap.tsx:250-267`): it zooms out, pans along the whole route for ~900ms, then hard-cuts to the actual day-0 view. This was verified by reading the current file — it fires fresh tile requests at multiple zoom levels for an animation whose own endpoint is immediately discarded, on every single page load.

`NepalMap.tsx` was assumed to have the same problem; it does not. Its `useEffect` sets `center`/`zoom` directly in the `maplibregl.Map` constructor (`src/components/map/NepalMap.tsx:400-418`) — no animation on mount. Its `warmTiles` helper only prefetches tiles in the background on `load`/`idle`; it doesn't drive the camera. No fix needed there.

## Fixes

**1. Remove RouteMap's warm-up animation.** Delete the `warm` rAF loop in `RouteMap.tsx` and call `applyActive(activeRef.current)` directly once the map and bounds are ready. Isolated change, one file, no new infra. The animated `flyTo` on explicit day clicks is untouched — that one is user-triggered and useful.

**2. Replace the blank skeleton with an instant static image, at all three mount points**, split by how often the underlying view changes:

- **Overview maps** (`MapTeaser`, `MapExplorer` — both render `NepalMap` via `MapLoader`): both show the same Nepal-wide satellite view regardless of which treks exist. One static image, generated once (not regenerated per save), is enough. `MapLoader.tsx`'s `loading:` callback renders this image instead of `.map-skeleton`.
- **Per-trek preview** (`RouteMap`, mounted in `TrekStory.tsx`): each trek/expedition has a different route bounding box, and routes change when admins edit them. This needs a real generation pipeline, triggered at save time.

## Architecture

### Per-trek preview generation

New `src/lib/mapPreview.ts`:

- `buildEsriExportUrl(bounds: { south: number; west: number; north: number; east: number }, size: { width: number; height: number }): string` — pure function. Builds an ArcGIS `World_Imagery/MapServer/export` URL (`bbox`, `bboxSR=4326`, `size`, `format=jpg`, `f=image`). Same public, unauthenticated Esri service `NepalMap.tsx` already hits for live tiles — no API key, no referrer restriction to worry about (Google Static Maps was considered and rejected: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is restricted to browser HTTP referrers per `.env.example`, so a server-side fetch with that key would very likely be rejected — confirmed by reading the key's documented restriction, not assumed). Applies a minimum padding around a trek's bounding box so a short/near-point route doesn't produce a degenerate zero-area bbox.
- `generateTrekPreview(trek: Trek): Promise<string | null>` — computes the bounding box from `trek.path`, calls `buildEsriExportUrl`, fetches the image, uploads the bytes via `@vercel/blob`'s `put()` (same `access: "private"` pattern as `src/app/api/upload/route.ts`, pathname `map-previews/<slug>-<timestamp>.jpg`), returns the `/api/blob?pathname=...` URL (same read-back pattern already used for gallery images). Wraps everything in try/catch — returns `null` and logs on any failure. Never throws.

### Trigger point

`src/app/api/treks/route.ts` (POST) and `src/app/api/treks/[slug]/route.ts` (PUT), after `writeTreks(treks)` succeeds and the success response is built: call `after()` from `next/server` (Next 16, confirmed stable and Vercel-supported by reading `node_modules/next/dist/docs/.../after.md` — this repo's `AGENTS.md` requires checking the shipped docs before writing against this Next version) with a callback that:

1. Calls `generateTrekPreview` for the just-saved trek.
2. If it returns a URL, re-reads treks (`readTreks()`), finds the same slug, patches `mapPreviewUrl`, and writes back (`writeTreks`).
3. Catches and logs any error from steps 1-2; never rethrows.

`after()` runs once the response has already been sent to the admin, so save latency is unaffected regardless of how long the Esri fetch + blob upload take.

### Data model

- `Trek.mapPreviewUrl?: string` — new optional field, `src/data/treks.ts`.
- `mapPreviewUrl: z.string().optional()` — new field, `trekSchema.ts`, so the value round-trips instead of being stripped the next time the trek is edited and re-validated.
- `DELETE /api/treks/[slug]/route.ts` already calls `deleteBlobRefs([trek.image, ...(trek.gallery ?? [])])` on delete — extend the array to include `trek.mapPreviewUrl` so deleting a trek also cleans up its preview blob.

### Client changes

- `TrekStory.tsx`: the `RouteMap` dynamic import's `loading:` callback currently renders `<div className="map-skeleton h-full w-full" />`. Change it to render `trek.mapPreviewUrl` as an `<img>` (object-cover, same dimensions) when present, falling back to the existing skeleton div when absent — new treks before their first background generation completes, or if generation failed, look exactly like they do today.
- `MapLoader.tsx`: `loading:` callback renders a static `public/map-preview-nepal.jpg` (generated once via the same `buildEsriExportUrl`, saved as a static asset — not regenerated per save, since the view doesn't depend on trek data) instead of `.map-skeleton`.

## Data flow

Admin saves a trek → `trekSchema` validates → `writeTreks` (fast, `mapPreviewUrl` unset on create) → 200 response returns to admin immediately → `after()` background: `generateTrekPreview` → Esri export fetch → blob `put` → re-read treks, patch `mapPreviewUrl` for that slug, `writeTreks` again. Visitor loading the trek page later sees the patched `mapPreviewUrl` as an instant `<img>`, with `RouteMap` mounting underneath once its own JS/tiles are ready.

## Error handling

- `generateTrekPreview` never throws — any failure (fetch error, non-2xx, blob upload error) is caught, logged with the trek slug, and the function returns `null`.
- The background patch-write (step 2 above) is also caught and logged; the original save already succeeded and returned before this runs, so a failure here is invisible to the admin.
- On the client, a missing `mapPreviewUrl` (new trek, or generation failed) falls back to today's behavior exactly — no regression case.

## Testing

- `src/lib/mapPreview.test.ts`: unit tests for `buildEsriExportUrl` — correct query params for a normal bbox, and a degenerate near-zero-area bbox gets minimum padding applied (not a black/empty tile). Pure function, no network or blob mocking needed.
- `generateTrekPreview` itself is thin glue (bbox math already covered by the above, fetch/`put` are third-party calls) — not unit ttested beyond a type-check/build pass, consistent with this codebase's existing density (e.g. `blobCleanup.ts` has no dedicated test either).
- Manual verification: with `BLOB_READ_WRITE_TOKEN` configured, save a trek from `/admin`, confirm (a) the save returns immediately without waiting on the preview, (b) `mapPreviewUrl` appears on the trek after a short delay, (c) the trek detail sidebar shows the image instantly on next load. If no live Blob store is available in this environment, this step is documented as environment-only, matching the existing pattern for DB-dependent manual checks in `docs/superpowers/plans/2026-08-13-map-everywhere-and-mobile.md`.

## Out of scope

- No dynamic generation for the Nepal-wide overview image — one static asset, generated once, checked in.
- No "regenerate preview" admin control — if an Esri crop ever looks wrong for a specific trek, that's a follow-up, not part of this pass.
- `NepalMap.tsx`'s `warmTiles` prefetch — confirmed not a bug (background-only, no camera animation), left untouched.
