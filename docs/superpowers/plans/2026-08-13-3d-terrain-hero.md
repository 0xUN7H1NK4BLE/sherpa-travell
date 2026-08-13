# 3D Terrain Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static photo backdrop on the home hero and the trek/expedition detail-page hero with a real WebGL terrain scene (React Three Fiber), with a correct fallback to the current photo on any device/browser/preference where 3D shouldn't run.

**Architecture:** A small `src/components/three/` library — a WebGL-capability check, a reduced-motion hook, a theme-color reader, an error/fallback boundary, and one `TerrainScene` component — wired into the two hero components via `next/dynamic({ ssr: false })`, matching the existing `RouteMap` dynamic-import pattern already used in this codebase (`src/components/trek/TrekStory.tsx:13`).

**Tech Stack:** `three`, `@react-three/fiber` (new dependencies). No `@react-three/drei` yet — not needed until the follow-up plan for card/divider accents.

## Global Constraints

- Every 3D component is dynamically imported with `ssr: false` — no 3D code runs during SSR or blocks initial HTML. Pattern: `src/components/trek/TrekStory.tsx:13-16`.
- Must respect `prefers-reduced-motion: reduce` — no camera drift, no animation loop, static frame only. Existing precedent: `src/app/globals.css:174-179` (`.aurora-bg`), `:376-380` (`.marquee-track`).
- Must degrade to the current photo hero with no WebGL support or a canvas init failure — never a blank canvas, never a thrown error reaching the page.
- Colors must come from the live computed value of this codebase's CSS custom properties (`--accent`, `--ink-muted`, `--bg`, defined at `src/app/globals.css:21-48`), read from the DOM at the hero's own container element — not `document.documentElement` — because both hero sections apply the `.photo-dark` class (`src/app/globals.css:52-65`), which locally overrides those variables to fixed dark values regardless of the light/dark theme toggle. Reading from `documentElement` would pick up the wrong (toggled) values instead of the scoped override.
- Terrain shape is a procedural approximation seeded from a number (e.g. altitude) — not real GIS data. No copy claiming geographic accuracy.
- No new dependency beyond `three` and `@react-three/fiber` in this plan.

---

### Task 1: Install 3D dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: `three` and `@react-three/fiber` importable from any component in later tasks.

- [ ] **Step 1: Install runtime and type dependencies**

Run:
```bash
npm install three @react-three/fiber
npm install -D @types/three
```

- [ ] **Step 2: Verify install**

Run: `npx tsc --noEmit`
Expected: no new errors (nothing imports these packages yet).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three and @react-three/fiber dependencies"
```

---

### Task 2: WebGL capability check, reduced-motion hook, theme-color hook

**Files:**
- Create: `src/components/three/webglSupport.ts`
- Create: `src/components/three/webglSupport.test.ts`
- Create: `src/components/three/usePrefersReducedMotion.ts`
- Create: `src/components/three/useThemeColor.ts`

**Interfaces:**
- Consumes: nothing (Task 1's dependencies aren't needed by these files — they're plain DOM/React, no `three` import).
- Produces:
  - `isWebGLAvailable(): boolean` — safe to call anywhere, including during SSR (returns `false` when `window` is undefined).
  - `usePrefersReducedMotion(): boolean` — client-only hook, named to avoid colliding with `framer-motion`'s own `useReducedMotion` hook already imported in `src/components/home/Hero.tsx:6` and `src/components/trek/StageHero.tsx:7`.
  - `useThemeColor(elementRef: React.RefObject<HTMLElement | null>, cssVar: string, fallback: string): string` — reads a CSS custom property's live computed value from the given element (not `documentElement`), re-reading whenever `<html data-theme>` changes.

- [ ] **Step 1: Write `webglSupport.ts`**

```ts
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Write the failing test for it**

`src/components/three/webglSupport.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isWebGLAvailable } from "./webglSupport";

test("isWebGLAvailable returns false outside a browser environment", () => {
  assert.equal(isWebGLAvailable(), false);
});
```

- [ ] **Step 3: Run it**

Run: `node --import tsx --test src/components/three/webglSupport.test.ts`
Expected: PASS (this repo's test runner has no `window`/`document` global, so the function's SSR guard is what makes it pass — this pins that guard).

- [ ] **Step 4: Write `usePrefersReducedMotion.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

- [ ] **Step 5: Write `useThemeColor.ts`**

```ts
"use client";

import { useEffect, useState, type RefObject } from "react";

export function useThemeColor(
  elementRef: RefObject<HTMLElement | null>,
  cssVar: string,
  fallback: string,
): string {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const read = () => {
      const value = getComputedStyle(el).getPropertyValue(cssVar).trim();
      if (value) setColor(value);
    };
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [elementRef, cssVar]);

  return color;
}
```

- [ ] **Step 6: Typecheck and run the full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: no new type errors; all tests pass including the new one.

- [ ] **Step 7: Commit**

```bash
git add src/components/three/webglSupport.ts src/components/three/webglSupport.test.ts \
  src/components/three/usePrefersReducedMotion.ts src/components/three/useThemeColor.ts
git commit -m "feat(three): add WebGL check, reduced-motion hook, theme-color hook"
```

---

### Task 3: `Scene3DBoundary` fallback wrapper

**Files:**
- Create: `src/components/three/Scene3DBoundary.tsx`

**Interfaces:**
- Consumes: `isWebGLAvailable` from `./webglSupport` (Task 2).
- Produces: `<Scene3DBoundary fallback={ReactNode}>{children}</Scene3DBoundary>` — renders `fallback` until mounted client-side, if WebGL is unavailable, or if `children` throws during render; otherwise renders `children`.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Component, type ReactNode, useEffect, useState } from "react";
import { isWebGLAvailable } from "./webglSupport";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Scene3DErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function Scene3DBoundary({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setMounted(true);
    setWebglOk(isWebGLAvailable());
  }, []);

  if (!mounted || !webglOk) return <>{fallback}</>;

  return <Scene3DErrorBoundary fallback={fallback}>{children}</Scene3DErrorBoundary>;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/three/Scene3DBoundary.tsx
git commit -m "feat(three): add Scene3DBoundary fallback/error wrapper"
```

---

### Task 4: `TerrainScene` component

**Files:**
- Create: `src/components/three/TerrainScene.tsx`

**Interfaces:**
- Consumes: `Scene3DBoundary` (Task 3), `usePrefersReducedMotion`, `useThemeColor` (Task 2), `three`, `@react-three/fiber` (Task 1).
- Produces: `<TerrainScene seed={number} peakAltitudeM={number} fallback={ReactNode} className={string} />` — a client-only component (the file itself does not need `ssr: false` internally; the *consumer* wraps the import in `next/dynamic({ ssr: false })`, per Global Constraints).

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Scene3DBoundary from "./Scene3DBoundary";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useThemeColor } from "./useThemeColor";

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Ridge({
  seed,
  peakHeight,
  color,
}: {
  seed: number;
  peakHeight: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const width = 40;
    const depth = 24;
    const geo = new THREE.PlaneGeometry(width, depth, 48, 24);
    geo.rotateX(-Math.PI / 2);

    const rand = seededRandom(seed);
    const position = geo.attributes.position;
    const ridgeCount = 4 + Math.floor(rand() * 3);
    const ridgeCenters = Array.from({ length: ridgeCount }, () => ({
      x: (rand() - 0.5) * width,
      z: (rand() - 0.5) * depth * 0.6,
      strength: 0.6 + rand() * 0.4,
    }));

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      let y = 0;
      for (const center of ridgeCenters) {
        const dx = x - center.x;
        const dz = z - center.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        y += Math.exp(-dist * dist * 0.01) * peakHeight * center.strength;
      }
      y += (rand() - 0.5) * 0.3;
      position.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed, peakHeight]);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial color={color} flatShading roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function TerrainContents({
  seed,
  peakHeight,
  reduced,
  mobile,
  containerRef,
}: {
  seed: number;
  peakHeight: number;
  reduced: boolean;
  mobile: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const driftEnabled = !reduced && !mobile;

  useFrame((state) => {
    if (!driftEnabled || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.06) * 0.08;
  });

  const terrainColor = useThemeColor(containerRef, "--ink-muted", "#93a3b5");
  const accentColor = useThemeColor(containerRef, "--accent", "#f59e0b");
  const bgColor = useThemeColor(containerRef, "--bg", "#0a0e14");

  return (
    <group ref={groupRef}>
      <fog attach="fog" args={[bgColor, 20, 55]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} color={accentColor} castShadow />
      <Ridge seed={seed} peakHeight={peakHeight} color={terrainColor} />
    </group>
  );
}

export default function TerrainScene({
  seed,
  peakAltitudeM,
  fallback,
  className,
}: {
  seed: number;
  peakAltitudeM?: number;
  fallback: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [mobile, setMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639.98px)");
    setMobile(query.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  const peakHeight = peakAltitudeM ? Math.min(6, 2 + peakAltitudeM / 3000) : 4;

  return (
    <div ref={containerRef} className={className}>
      <Scene3DBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 5, 18], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <TerrainContents
              seed={seed}
              peakHeight={peakHeight}
              reduced={reduced}
              mobile={mobile}
              containerRef={containerRef}
            />
          </Suspense>
        </Canvas>
      </Scene3DBoundary>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. Fix any minor type mismatches (e.g. `@react-three/fiber` JSX intrinsic element types) while preserving the structure above — these are typing details, not design changes.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds. `TerrainScene.tsx` isn't imported anywhere yet, so this mainly confirms no syntax/type errors block the build.

- [ ] **Step 4: Commit**

```bash
git add src/components/three/TerrainScene.tsx
git commit -m "feat(three): add TerrainScene procedural terrain component"
```

---

### Task 5: Wire `TerrainScene` into the home hero

**Files:**
- Modify: `src/components/home/Hero.tsx:1-54`

**Interfaces:**
- Consumes: `TerrainScene` (Task 4), via `next/dynamic({ ssr: false })`.

- [ ] **Step 1: Add the dynamic import**

At the top of `src/components/home/Hero.tsx`, after the existing imports, add:

```tsx
import dynamic from "next/dynamic";

const TerrainScene = dynamic(() => import("@/components/three/TerrainScene"), {
  ssr: false,
});
```

- [ ] **Step 2: Replace the photo `<img>` inside the parallax wrapper**

Find this block (currently lines 44-54):

```tsx
      <motion.div
        style={reduce ? undefined : { y, opacity, x: photoX }}
        className="absolute inset-0"
        aria-hidden
      >
        <img
          src="/images/hero.jpg"
          alt=""
          className="h-full w-full scale-105 object-cover"
        />
      </motion.div>
```

Replace the `<img>` inside it with `TerrainScene`, keeping the same motion wrapper and the original `<img>` as the fallback:

```tsx
      <motion.div
        style={reduce ? undefined : { y, opacity, x: photoX }}
        className="absolute inset-0"
        aria-hidden
      >
        <TerrainScene
          seed={1}
          peakAltitudeM={8848}
          className="h-full w-full"
          fallback={
            <img
              src="/images/hero.jpg"
              alt=""
              className="h-full w-full scale-105 object-cover"
            />
          }
        />
      </motion.div>
```

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Manual verification (source-level, no browser automation in this environment)**

Confirm via `git diff` that:
- The `dynamic(..., { ssr: false })` wrapper is present.
- The original `<img>` markup is preserved verbatim inside `fallback`, so the no-WebGL path renders exactly what shipped before this task.
- No other part of `Hero.tsx` changed (parallax motion values, headline, buttons, scroll indicator all untouched).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.tsx
git commit -m "feat(home): replace hero photo with WebGL terrain scene"
```

---

### Task 6: Wire `TerrainScene` into the trek/expedition detail hero

**Files:**
- Modify: `src/components/trek/StageHero.tsx:1-64`

**Interfaces:**
- Consumes: `TerrainScene` (Task 4), via `next/dynamic({ ssr: false })`. `StageHero` already receives `trek: RouteContent`, which has `slug: string` and `maxAltitudeM: number` (used elsewhere in the same file at line 42) — reuse both directly, no new prop plumbing needed.

`StageHero` is shared by both `/treks/[slug]` and `/expeditions/[slug]` (confirmed: `src/app/treks/[slug]/page.tsx:40` and `src/app/expeditions/[slug]/page.tsx:40` both render it), so this one change covers both content types.

- [ ] **Step 1: Add the dynamic import and a slug-seed helper**

At the top of `src/components/trek/StageHero.tsx`, after the existing imports, add:

```tsx
import dynamic from "next/dynamic";

const TerrainScene = dynamic(() => import("@/components/three/TerrainScene"), {
  ssr: false,
});

function seedFromSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}
```

- [ ] **Step 2: Replace the photo `<img>` inside the parallax wrapper**

Find this block (currently lines 53-64):

```tsx
      <motion.div
        style={reduce ? undefined : { x: photoX }}
        className="absolute inset-0"
        aria-hidden
      >
        <img
          src={trek.image}
          alt=""
          aria-hidden
          className="h-full w-full scale-110 object-cover"
        />
      </motion.div>
```

Replace the `<img>` inside it with `TerrainScene`, keeping the same motion wrapper and the original `<img>` as the fallback:

```tsx
      <motion.div
        style={reduce ? undefined : { x: photoX }}
        className="absolute inset-0"
        aria-hidden
      >
        <TerrainScene
          seed={seedFromSlug(trek.slug)}
          peakAltitudeM={trek.maxAltitudeM}
          className="h-full w-full"
          fallback={
            <img
              src={trek.image}
              alt=""
              aria-hidden
              className="h-full w-full scale-110 object-cover"
            />
          }
        />
      </motion.div>
```

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. Confirm the build log still statically generates all `/treks/[slug]` (8 paths) and `/expeditions/[slug]` (3 paths) routes, matching Phase 3's verified counts.

- [ ] **Step 4: Manual verification (source-level)**

Confirm via `git diff` that:
- Every trek/expedition still gets a distinct `seed` (derived from its own slug) and a distinct `peakAltitudeM` (its own data) — no two routes silently render identical terrain.
- The original `<img src={trek.image}>` is preserved verbatim inside `fallback`.
- No other part of `StageHero.tsx` changed (breadcrumb, quick-facts panel, headline, CTA all untouched).

- [ ] **Step 5: Commit**

```bash
git add src/components/trek/StageHero.tsx
git commit -m "feat(trek): replace detail-page hero photo with WebGL terrain scene"
```

---

### Task 7: Full verification pass

**Files:** none (verification only — no commits from this task).

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all tests pass except the pre-existing, documented `inquiryStore.test.ts` DB-connection gap (no live Postgres in this environment) — that failure is expected and out of scope.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 errors. Pre-existing `@next/next/no-img-element` warnings on unrelated files are expected; do not introduce new warnings on the files this plan touches beyond the two intentional `fallback` `<img>` tags (which already existed before this plan and are unchanged).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds, same static route counts as Phase 3 (`/treks/[slug]` 8 paths, `/expeditions/[slug]` 3 paths).

- [ ] **Step 5: Scope check**

Run: `git diff <task-1-start-commit> --stat`
Expected: only the files listed across Tasks 1-6 changed — `package.json`, `package-lock.json`, the six new `src/components/three/*` files, `src/components/home/Hero.tsx`, `src/components/trek/StageHero.tsx`. No unrelated files touched.

- [ ] **Step 6: Confirm degradation paths are wired correctly (source-level)**

Re-read `Scene3DBoundary.tsx` and confirm: (a) it renders `fallback` before client mount — no 3D content can appear in the initial static HTML; (b) it renders `fallback` when `isWebGLAvailable()` is false; (c) the class-based error boundary catches a render-time throw from `children` and renders `fallback`. All three paths route to the same `fallback` prop the two hero components already supply (their original photo markup), so a failure anywhere in the 3D stack is invisible to a site visitor — the page looks exactly like it did before this plan.

---

## Follow-up (not in this plan)

`AbstractAccent` (particle/shard accents for listing cards — `TrekStage.tsx`, used inside `TrekFinder.tsx` — and section dividers on About/Contact/Gallery) is a separate follow-up plan. It depends on `Scene3DBoundary` and the hooks from Tasks 2-3 above, reused as-is, but needs its own component and its own per-page wiring decisions once this plan's terrain heroes are visible and reviewed.
