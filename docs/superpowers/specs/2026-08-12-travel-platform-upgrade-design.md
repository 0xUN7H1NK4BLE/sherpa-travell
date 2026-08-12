# Travel platform upgrade — design

Date: 2026-08-12
Status: approved for implementation, phased

## Context

Sherpa Travell is a Next.js 16 site for guided treks in Nepal. Current state:

- **Content ("treks")**: stored as JSON (`src/data/treks.json`), read via `src/lib/jsonStore.ts`. Admin writes go either straight to the local file or, if `GITHUB_REPO`/`GITHUB_TOKEN` are set, as a commit to the GitHub repo via the Contents API (git-as-database). No relational DB.
- **Admin**: HMAC-signed cookie session (`src/lib/adminAuth.ts`), trek CRUD (`TrekManager.tsx` + `TrekForm.tsx`, 551 lines, covers most trek fields including a Leaflet day-by-day map editor `DayMap.tsx`), gallery CRUD (`GalleryAdmin.tsx`), image upload to Vercel Blob.
- **Inquiries**: `POST /api/inquiry` validates with zod and **only `console.info`s the result** — no persistence, no email, no admin visibility. Leads are currently lost.
- **Map**: `RouteMap.tsx` exists as a trek-detail component but is **not rendered** on `/treks/[slug]` — only the standalone `/map` page (`MapExplorer.tsx`) shows routes. Confirmed by reading the page source.
- **Expeditions**: no content type. Only "treks" exist (`difficulty` capped at "Strenuous", no peak/summit-specific fields like permit cost, technical grade, or summit success considerations).
- **Site settings** (contact info, nav, hero copy): hardcoded in `src/data/site.ts`, not admin-editable.
- Hosting: Vercel, user has Vercel CLI available, wants **free-tier-only** infra.

## Goals

1. Stop losing leads: persist inquiries to a real database, give admin an inbox to see/manage them.
2. Add a "peak expedition" content type (Mt Himlung, Ama Dablam, etc.) alongside treks, with full admin CRUD.
3. Admin can edit anything editorially important from the admin page — no hand-editing JSON/files for routine content changes.
4. Route map shown on every trek and expedition detail page, not just the standalone `/map` page.
5. Mobile-first responsive pass across public site and admin.
6. Deploy to Vercel with the new DB provisioned, using the Vercel CLI, on free tiers only.

## Non-goals

- No payment processing / real booking engine (inquiry-based booking stays inquiry-based).
- No migration of treks/expeditions content itself into Postgres — git-as-JSON stays for editorial content (see decision below).
- No user accounts / customer login.
- No multi-language i18n.

## Key decisions

**Database: Vercel Postgres (Neon-backed) free tier, via Drizzle ORM.**
Free, serverless-native, provisions via `vercel postgres create` / Vercel Marketplace, credentials pulled with `vercel env pull`. Drizzle chosen over Prisma for a lighter serverless footprint (no generated client binary, works well on Vercel's Node/Edge runtimes) and simpler migrations for a schema this small.

**Hybrid persistence, not full migration.**
Treks and expeditions stay in git-as-JSON — it's already working, versioned, free, and matches the existing admin UX (`TrekForm`, `DayMap`). Postgres is added only for transactional/operational data: inquiries and (new) admin-visible status on them. This avoids a risky rewrite of working CRUD and keeps editorial content in git history where it's easy to review/revert.

**Expeditions as a sibling content type, not a trek subtype.**
Separate schema/table/JSON file (`expeditions.json`) and separate admin manager, but sharing the itinerary/day/place primitives already in `trekSchema.ts` (`itineraryDaySchema`, `placeSchema`) via a shared base. Peaks need fields treks don't: `peakHeightM`, `climbingGrade` (e.g. Alpine PD/AD/D or trekking-peak grading), `permitCostUSD`, `technicalGearRequired: boolean`, `summitSuccessNotes`. Reusing the itinerary/day/map building blocks means `DayMap.tsx` and `RouteMap.tsx` work for both content types with no fork.

## Architecture

```
src/lib/db/
  client.ts       # Drizzle client, reads POSTGRES_URL (Vercel env)
  schema.ts       # Drizzle table defs: inquiries
  migrations/     # drizzle-kit generated SQL

src/lib/inquiryStore.ts   # insert/list/updateStatus against Postgres

src/data/
  treks.ts / treks.json          (existing, unchanged shape)
  expeditions.ts / expeditions.json  (new, mirrors treks.ts pattern)

src/lib/expeditionSchema.ts   # extends shared itinerary/place schemas from trekSchema.ts
src/lib/expeditionStore.ts    # mirrors trekStore.ts (readJson/writeJson against expeditions.json)

src/app/expeditions/page.tsx          # listing, mirrors /treks
src/app/expeditions/[slug]/page.tsx   # detail, mirrors /treks/[slug], + RouteMap

src/components/admin/
  ExpeditionForm.tsx     # mirrors TrekForm.tsx, reuses DayMap
  ExpeditionManager.tsx  # mirrors TrekManager.tsx
  InquiryInbox.tsx       # new: list/filter/mark-status for inquiries
  SiteSettingsForm.tsx   # new: edit src/data/site.ts fields via jsonStore

src/app/api/expeditions/...   # mirrors /api/treks
src/app/api/inquiries/route.ts (admin GET, list) — POST stays public at /api/inquiry
src/app/api/admin/settings/route.ts  # site settings read/write
```

Trek detail and expedition detail pages both render `RouteMap` (already built, currently orphaned) using `trek.coordinates`/`trek.path` — no new map component needed, just wiring plus reuse for expeditions.

## Data flow

- **Inquiry**: visitor submits form → `POST /api/inquiry` → zod validate → insert row into Postgres `inquiries` table (status `new`) → (best-effort) no email in v1, admin checks inbox. Admin inbox: `GET /api/inquiries` (session-gated) → list, filter by status, mark `contacted`/`closed`.
- **Expedition content**: identical flow to treks today — admin form → zod validate (`expeditionSchema`) → `writeJson` (local file or GitHub commit, same as `jsonStore.ts` already does) → static pages rebuilt on next deploy (git-backed) or on-demand revalidate (local dev).
- **Site settings**: admin form → `writeJson("src/data/site.ts"...)` — since `site.ts` is a `.ts` const today, this needs converting to a JSON-backed value (`site.json` + a thin `site.ts` that imports it) so `jsonStore` can write it like treks/expeditions. Keeps existing `import { site } from "@/data/site"` call sites unchanged.

## Error handling

- Inquiry POST: DB insert failure returns 500 with `{ ok: false }`, logs server-side; existing zod validation errors unchanged (400).
- Admin writes (expeditions/settings): same pattern already used by trek writes — zod safeParse, 400 on validation failure, existing GitHub-write error propagation unchanged.
- DB client: single lazy-initialized Drizzle instance; missing `POSTGRES_URL` throws a clear startup error rather than failing silently (inquiries are the whole point of this phase — must fail loud, not silent).

## Testing

- Zod schema unit checks for `expeditionSchema` (valid/invalid peak fields) mirroring any existing trek schema tests (check for existing pattern first).
- Manual verification per phase via the `run` skill: submit inquiry → confirm row in DB → confirm shows in admin inbox; create expedition in admin → confirm public page renders with map; resize to mobile viewport → confirm nav/forms usable.
- No new e2e framework introduced — match whatever (if any) test setup already exists in the repo.

## Phases (each gets its own implementation plan, executed in order)

1. **DB + inquiries** — Postgres provisioning, Drizzle schema/client, inquiry persistence, admin inquiry inbox.
2. **Expeditions content type** — schema, store, admin CRUD (form + manager), public listing + detail pages.
3. **Map everywhere + mobile UI pass** — wire `RouteMap` into trek and expedition detail pages; responsive audit/fixes across public site and admin (nav, forms, tables, image upload, map controls) at mobile breakpoints.
4. **Site settings admin + Vercel deploy** — make `site.ts` content admin-editable; provision Postgres and env vars via Vercel CLI; deploy; verify production.

## Open items resolved during self-review

- Confirmed `RouteMap.tsx` is currently unused dead code on the trek detail page (not a design assumption — verified by reading `src/app/treks/[slug]/page.tsx`).
- Confirmed no existing DB dependency in `package.json` — Postgres client/Drizzle will be new dependencies (justified: this is the one place the design intentionally adds real persistence).
- `site.ts` conversion to JSON-backed is called out explicitly since it changes a currently-hardcoded module into data — avoids surprise later.
