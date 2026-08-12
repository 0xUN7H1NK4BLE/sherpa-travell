# Phase 1: Database + Inquiry Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop losing inquiry leads — persist them to a real free-tier Postgres database and give admin an inbox to see and manage them.

**Architecture:** Vercel Postgres (Neon-backed, `free_v3` plan) provisioned via Vercel Marketplace, accessed through Drizzle ORM. `POST /api/inquiry` (public) inserts a row instead of only logging. New session-gated `/api/admin/inquiries` routes list/update rows. A new `InquiryInbox` admin component (mirrors existing `TrekManager` patterns) renders them as a new "Inquiries" tab on `/admin`.

**Tech Stack:** `drizzle-orm` + `postgres` (node-postgres-compatible driver over the pooled Neon connection string), `drizzle-kit` for schema push (dev deps). Node's built-in `node:test` + `node:assert/strict` for unit tests — no test framework exists in the repo yet, and the built-in runner avoids adding one for a handful of tests (matches repo's zero-test-dependency starting point).

## Global Constraints

- Next.js is a custom fork with breaking changes vs. stock — route handlers use the `RouteContext<'/path'>` typed helper (see `src/app/api/treks/[slug]/route.ts` for the established pattern). Follow it exactly for any new dynamic route.
- All admin-mutating routes must call `isAuthenticated()` from `src/lib/adminAuth.ts` first and return `401` `{ ok: false, error: "Unauthorized" }` on failure — established pattern in every existing `/api/admin/*` and admin-mutating route.
- All request bodies validated with `zod` `safeParse`, errors returned as `{ ok: false, error, issues }` with `400` — established pattern in `src/app/api/inquiry/route.ts` and `src/app/api/treks/route.ts`.
- Free tier only: Neon plan must be `free_v3`. No paid Vercel add-ons.
- No new UI framework/component library — match existing Tailwind utility classes and the visual language already used in `src/components/admin/*` (rounded-2xl cards, `border-line`, `bg-night/40`, `text-mist`, `bg-saffron` accents).

---

### Task 1: Provision Postgres and wire environment

**Files:**
- Create: `.env.local` entries (not committed — already gitignored via `.env*`)
- No source files yet

**Interfaces:**
- Produces: a `POSTGRES_URL` (or Neon's `DATABASE_URL`, whichever the integration injects) environment variable available both locally (via `vercel env pull`) and in the Vercel project (all environments).

- [ ] **Step 1: Link the local repo to the existing Vercel project**

Run: `vercel link --yes --project sherpatreks`
Expected: creates `.vercel/project.json`, prints "Linked to ... sherpatreks".

- [ ] **Step 2: Install the Neon Postgres integration on the free plan**

Run:
```bash
vercel integration add neon \
  --plan free_v3 \
  -m region=sin1 \
  -m auth=false \
  --name sherpatreks-db \
  -e production -e preview -e development \
  --json
```
Expected: JSON output confirming a resource was created and connected to the `sherpatreks` project across all three environments. `region=sin1` (Singapore) is the closest free Neon region to Nepal. `auth=false` because Neon Auth (managed user accounts) is out of scope (no customer login — see design non-goals).

- [ ] **Step 3: Pull the injected environment variables locally**

Run: `vercel env pull .env.local`
Expected: `.env.local` now contains a Postgres connection string (check `grep -i postgres .env.local` or `grep -i database_url .env.local` — record the exact variable name, it varies by integration version, and use that exact name in Task 2's client).

- [ ] **Step 4: Verify connectivity**

Run: `node -e "require('node:child_process')" ` — skip; instead verify with the driver in Task 2 (no standalone verification step needed here, folded into Task 2's Step 5).

---

### Task 2: Drizzle schema, client, and migration

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/client.ts`
- Create: `drizzle.config.ts`
- Modify: `package.json` (add `drizzle-orm`, `postgres` deps; `drizzle-kit` devDep; add a `"db:push": "drizzle-kit push"` script)
- Test: `src/lib/db/client.test.ts`

**Interfaces:**
- Produces:
  - `db` — a Drizzle instance exported from `src/lib/db/client.ts`, typed against `schema.ts`.
  - `inquiries` table export from `src/lib/db/schema.ts` with columns: `id` (serial PK), `name` (text, not null), `email` (text, not null), `trek` (text, nullable), `dates` (text, nullable), `groupSize` (text, nullable), `message` (text, nullable), `status` (text, not null, default `'new'`), `createdAt` (timestamp, not null, default now).

- [ ] **Step 1: Install dependencies**

Run: `npm install drizzle-orm postgres && npm install -D drizzle-kit`
Expected: `package.json` dependencies updated, `node_modules` has the packages.

- [ ] **Step 2: Write the schema**

```typescript
// src/lib/db/schema.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  trek: text("trek"),
  dates: text("dates"),
  groupSize: text("group_size"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
```

- [ ] **Step 3: Write the Drizzle client**

```typescript
// src/lib/db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function connectionString(): string {
  const url =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error(
      "No Postgres connection string found (checked POSTGRES_URL, DATABASE_URL, DATABASE_URL_UNPOOLED). " +
        "Run `vercel env pull .env.local` after provisioning the database.",
    );
  }
  return url;
}

const client = postgres(connectionString(), { max: 1 });

export const db = drizzle(client, { schema });
```

Note: check which exact env var name Task 1 Step 3 recorded and add it first in the `??` chain if it differs from `POSTGRES_URL`/`DATABASE_URL`.

- [ ] **Step 4: Write the Drizzle Kit config**

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.POSTGRES_URL ??
      process.env.DATABASE_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      "",
  },
});
```

Add to `package.json` `"scripts"`: `"db:push": "drizzle-kit push"`.

- [ ] **Step 5: Push the schema to the real database and verify**

Run: `npm run db:push` (accept the prompt to create the `inquiries` table if drizzle-kit asks)
Expected: output confirms the `inquiries` table was created.

Then write and run a connectivity smoke test:

```typescript
// src/lib/db/client.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { db } from "./client";
import { inquiries } from "./schema";

test("db client can query the inquiries table", async () => {
  const rows = await db.select().from(inquiries).limit(1);
  assert.ok(Array.isArray(rows));
});
```

Run: `node --import tsx --test src/lib/db/client.test.ts` (if `tsx` isn't installed, run `npm install -D tsx` first — needed to run `.ts` test files directly with `node:test`)
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json drizzle.config.ts src/lib/db
git commit -m "feat: add Postgres (Neon) + Drizzle client and inquiries schema"
```

---

### Task 3: Inquiry store

**Files:**
- Create: `src/lib/inquiryStore.ts`
- Test: `src/lib/inquiryStore.test.ts`

**Interfaces:**
- Consumes: `db` and `inquiries` from `src/lib/db/client.ts` / `src/lib/db/schema.ts` (Task 2).
- Produces:
  - `insertInquiry(data: { name: string; email: string; trek?: string; dates?: string; groupSize?: string; message?: string }): Promise<Inquiry>`
  - `listInquiries(): Promise<Inquiry[]>` — newest first
  - `updateInquiryStatus(id: number, status: "new" | "contacted" | "closed"): Promise<Inquiry | null>` — returns `null` if no row matched

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/inquiryStore.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { insertInquiry, listInquiries, updateInquiryStatus } from "./inquiryStore";

test("insertInquiry persists and listInquiries returns it newest-first", async () => {
  const created = await insertInquiry({ name: "Test User", email: "test@example.com", trek: "everest-base-camp" });
  assert.equal(created.name, "Test User");
  assert.equal(created.status, "new");

  const all = await listInquiries();
  assert.equal(all[0]?.id, created.id);
});

test("updateInquiryStatus updates status and returns the row", async () => {
  const created = await insertInquiry({ name: "Status Test", email: "status@example.com" });
  const updated = await updateInquiryStatus(created.id, "contacted");
  assert.equal(updated?.status, "contacted");
});

test("updateInquiryStatus returns null for missing id", async () => {
  const result = await updateInquiryStatus(999999, "closed");
  assert.equal(result, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/inquiryStore.test.ts`
Expected: FAIL — `Cannot find module './inquiryStore'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/inquiryStore.ts
import { desc, eq } from "drizzle-orm";
import { db } from "./db/client";
import { inquiries, type Inquiry } from "./db/schema";

export interface NewInquiryInput {
  name: string;
  email: string;
  trek?: string;
  dates?: string;
  groupSize?: string;
  message?: string;
}

export async function insertInquiry(data: NewInquiryInput): Promise<Inquiry> {
  const [row] = await db.insert(inquiries).values(data).returning();
  return row;
}

export async function listInquiries(): Promise<Inquiry[]> {
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

export async function updateInquiryStatus(
  id: number,
  status: "new" | "contacted" | "closed",
): Promise<Inquiry | null> {
  const [row] = await db
    .update(inquiries)
    .set({ status })
    .where(eq(inquiries.id, id))
    .returning();
  return row ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/inquiryStore.test.ts`
Expected: PASS (3 tests). This hits the real dev database provisioned in Task 1 — confirm afterward with `npm run db:push -- --help` is not needed; instead spot check row count grew as expected (optional: query via a one-off script) then move on.

- [ ] **Step 5: Commit**

```bash
git add src/lib/inquiryStore.ts src/lib/inquiryStore.test.ts
git commit -m "feat: add inquiryStore (insert/list/updateStatus)"
```

---

### Task 4: Persist real inquiries from the public form + basic abuse limiting

**Files:**
- Modify: `src/app/api/inquiry/route.ts`

**Interfaces:**
- Consumes: `insertInquiry` from `src/lib/inquiryStore.ts` (Task 3).
- Produces: `POST /api/inquiry` now returns `{ ok: true, id: number }` on success (previously `{ ok: true }` only — additive, no existing consumer breaks since the public form only checks `ok`).

- [ ] **Step 1: Replace the console.info-only handler**

```typescript
// src/app/api/inquiry/route.ts
import { z } from "zod";
import { insertInquiry } from "@/lib/inquiryStore";

const inquirySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  trek: z.string().max(120).optional(),
  dates: z.string().max(200).optional(),
  groupSize: z.string().max(40).optional(),
  message: z.string().max(4000).optional(),
});

// Simple in-memory rate limiter per client IP, matching the pattern in
// src/app/api/admin/login/route.ts. Best-effort in serverless (per-instance)
// but stops casual spam against a single instance.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "unknown").trim();
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    return Response.json(
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const nextCount = (record?.count ?? 0) + 1;
  attempts.set(ip, { count: nextCount, until: now + WINDOW_MS });

  const created = await insertInquiry(parsed.data);
  return Response.json({ ok: true, id: created.id });
}
```

- [ ] **Step 2: Manual verify against the real dev server**

Run: `npm run dev` (background), then in another shell:
```bash
curl -s -X POST http://localhost:3000/api/inquiry \
  -H 'Content-Type: application/json' \
  -d '{"name":"Curl Test","email":"curl@example.com","trek":"everest-base-camp"}'
```
Expected: `{"ok":true,"id":<number>}`. Then run a 6th request within 10 minutes from the same shell and confirm the 6th returns `429`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/inquiry/route.ts
git commit -m "feat: persist inquiries to Postgres, rate-limit submissions"
```

---

### Task 5: Admin inquiries API

**Files:**
- Create: `src/app/api/admin/inquiries/route.ts`
- Create: `src/app/api/admin/inquiries/[id]/route.ts`

**Interfaces:**
- Consumes: `isAuthenticated` (`src/lib/adminAuth.ts`), `listInquiries`/`updateInquiryStatus` (`src/lib/inquiryStore.ts`).
- Produces:
  - `GET /api/admin/inquiries` → `{ ok: true, inquiries: Inquiry[] }` (401 if not authed).
  - `PATCH /api/admin/inquiries/[id]` body `{ status: "new" | "contacted" | "closed" }` → `{ ok: true, inquiry: Inquiry }`, `404` if missing, `400` on bad status, `401` if not authed.

- [ ] **Step 1: List route**

```typescript
// src/app/api/admin/inquiries/route.ts
import { isAuthenticated } from "@/lib/adminAuth";
import { listInquiries } from "@/lib/inquiryStore";

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const inquiries = await listInquiries();
  return Response.json({ ok: true, inquiries });
}
```

- [ ] **Step 2: Status update route**

```typescript
// src/app/api/admin/inquiries/[id]/route.ts
import { z } from "zod";
import { isAuthenticated } from "@/lib/adminAuth";
import { updateInquiryStatus } from "@/lib/inquiryStore";

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/inquiries/[id]">,
) {
  if (!(await isAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }
  const updated = await updateInquiryStatus(numericId, parsed.data.status);
  if (!updated) {
    return Response.json({ ok: false, error: "Inquiry not found" }, { status: 404 });
  }
  return Response.json({ ok: true, inquiry: updated });
}
```

- [ ] **Step 3: Manual verify**

Run dev server, then:
```bash
# Should 401 without a session cookie
curl -s http://localhost:3000/api/admin/inquiries
```
Expected: `{"ok":false,"error":"Unauthorized"}` with 401. Full authenticated flow verified end-to-end in Task 7.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/inquiries
git commit -m "feat: add admin inquiries list/update API routes"
```

---

### Task 6: Admin inquiry inbox UI

**Files:**
- Create: `src/components/admin/InquiryInbox.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/inquiries`, `PATCH /api/admin/inquiries/[id]` (Task 5). No props needed beyond nothing — self-fetching component, matching how `GalleryAdmin` self-manages its own data (check `src/components/admin/GalleryAdmin.tsx` for the established self-fetch pattern before writing this, to stay consistent).
- Produces: default export `InquiryInbox()` — a client component, mounted as a new admin tab.

- [ ] **Step 1: Write the component**

```typescript
// src/components/admin/InquiryInbox.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type Status = "new" | "contacted" | "closed";

interface Inquiry {
  id: number;
  name: string;
  email: string;
  trek: string | null;
  dates: string | null;
  groupSize: string | null;
  message: string | null;
  status: Status;
  createdAt: string;
}

const statusColor: Record<Status, string> = {
  new: "bg-saffron/15 text-saffron border-saffron/25",
  contacted: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  closed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
};

export default function InquiryInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [updating, setUpdating] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/inquiries", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setInquiries(data.inquiries);
    else setError(data.error ?? "Failed to load inquiries");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setStatus(id: number, status: Status) {
    setUpdating(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      await refresh();
    } catch {
      setError("Update failed");
    } finally {
      setUpdating(null);
    }
  }

  if (!inquiries) return <p className="mt-6 text-sm text-mist">Loading…</p>;

  const visible = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  return (
    <div className="mt-10">
      {error && (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-saffron bg-saffron/15 text-saffron"
                : "border-line-strong text-mist hover:text-snow"
            }`}
          >
            {f} {f !== "all" && `(${inquiries.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {visible.length === 0 && (
          <p className="text-sm text-mist">No inquiries in this view.</p>
        )}
        {visible.map((inquiry) => (
          <div key={inquiry.id} className="rounded-2xl border border-line bg-night/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-snow">{inquiry.name}</p>
                <a href={`mailto:${inquiry.email}`} className="text-sm text-mist hover:text-saffron">
                  {inquiry.email}
                </a>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${statusColor[inquiry.status]}`}
              >
                {inquiry.status}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-mist md:grid-cols-4">
              {inquiry.trek && (
                <div>
                  <dt className="uppercase tracking-wide">Trek</dt>
                  <dd className="text-snow/90">{inquiry.trek}</dd>
                </div>
              )}
              {inquiry.dates && (
                <div>
                  <dt className="uppercase tracking-wide">Dates</dt>
                  <dd className="text-snow/90">{inquiry.dates}</dd>
                </div>
              )}
              {inquiry.groupSize && (
                <div>
                  <dt className="uppercase tracking-wide">Group size</dt>
                  <dd className="text-snow/90">{inquiry.groupSize}</dd>
                </div>
              )}
              <div>
                <dt className="uppercase tracking-wide">Received</dt>
                <dd className="text-snow/90">{new Date(inquiry.createdAt).toLocaleString()}</dd>
              </div>
            </dl>

            {inquiry.message && (
              <p className="mt-3 text-sm text-mist">{inquiry.message}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(["new", "contacted", "closed"] as const)
                .filter((s) => s !== inquiry.status)
                .map((s) => (
                  <button
                    key={s}
                    disabled={updating === inquiry.id}
                    onClick={() => setStatus(inquiry.id, s)}
                    className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-medium capitalize text-snow transition-colors hover:border-saffron hover:text-saffron disabled:opacity-50"
                  >
                    Mark {s}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/InquiryInbox.tsx
git commit -m "feat: add InquiryInbox admin component"
```

---

### Task 7: Wire the Inquiries tab into the admin page and verify end-to-end

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin/AdminOverview.tsx` (add a "New inquiries" stat tile)

**Interfaces:**
- Consumes: `InquiryInbox` default export (Task 6).

- [ ] **Step 1: Add the tab**

In `src/app/admin/page.tsx`: change `type Tab = "overview" | "treks" | "gallery"` to `type Tab = "overview" | "treks" | "gallery" | "inquiries"`, add `{ id: "inquiries", label: "Inquiries" }` to the `tabs` array, import `InquiryInbox` from `@/components/admin/InquiryInbox`, and render `{tab === "inquiries" && <InquiryInbox />}` alongside the existing tab blocks.

- [ ] **Step 2: Surface a new-inquiries count on the overview tab**

In `src/components/admin/AdminOverview.tsx`, add an optional prop `newInquiryCount?: number` and, when defined, prepend a stat tile `{ label: "New inquiries", value: String(newInquiryCount) }` to the existing `stats` array. In `src/app/admin/page.tsx`, fetch `/api/admin/inquiries` alongside treks in the existing `useEffect`/`refresh`, derive `newInquiryCount` from `data.inquiries.filter(i => i.status === "new").length`, and pass it to `<AdminOverview newInquiryCount={newInquiryCount} .../>`.

- [ ] **Step 3: Full manual end-to-end verification**

Use the `run` skill (or manual browser) against `npm run dev`:
1. Submit a real inquiry through the public contact form (`/contact` or wherever `InquiryCTA`/the contact page posts to `/api/inquiry`) with real-looking test data.
2. Log into `/admin/login` with the configured admin credentials.
3. Confirm the new inquiry appears under the "Inquiries" tab with status `new`, and the Overview tab's "New inquiries" tile reflects it.
4. Click "Mark contacted", confirm the badge and filter counts update without a page reload.
5. Refresh the page fully — confirm the status persisted (proves it's in Postgres, not local state).

Expected: all five steps pass. If step 1's contact form doesn't already post `trek`/`dates`/`groupSize`, that's fine — those fields are optional; just confirm `name`/`email`/`message` round-trip.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/components/admin/AdminOverview.tsx
git commit -m "feat: wire Inquiries tab and new-inquiry count into admin dashboard"
```

---

## Self-Review Notes

- **Spec coverage:** Design doc's Phase 1 goals — "persist inquiries", "admin inbox" — both covered (Tasks 1–7). DB choice (Vercel Postgres/Neon, free tier, Drizzle) matches design decision exactly. Error handling matches design's "fail loud on missing `POSTGRES_URL`" requirement (Task 2 Step 3).
- **No placeholders:** all steps have literal code/commands, no "add validation" hand-waving.
- **Type consistency:** `Inquiry`/`NewInquiryInput` shape is identical across `db/schema.ts` (Task 2), `inquiryStore.ts` (Task 3), the API routes (Tasks 4–5), and the `InquiryInbox` component's local `Inquiry` interface (Task 6) — `trek`/`dates`/`groupSize`/`message` all nullable/optional consistently.
- **Env var name risk:** flagged explicitly in Task 1 Step 3 and Task 2 Step 3/4 since Vercel Marketplace integrations don't always use `POSTGRES_URL` — the `??` fallback chain covers the likely names, executor must confirm against the actual pulled `.env.local`.
