"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { RouteContent } from "@/lib/routeContent";
import { trailWaypoints, getTrekLabels } from "@/data/dayViews";
import { loadGoogleMaps } from "@/lib/googleMaps";

const DARK = "#0a0e14";
const ACCENT = "#f59e0b";

const PLACE_COLORS: Record<string, string> = {
  peak: ACCENT,
  basecamp: "#7dd3fc",
  lake: "#60a5fa",
  monastery: "#c084fc",
  pass: "#94a3b8",
  city: "#e8edf4",
  river: "#38bdf8",
};

function ll(p: [number, number]): google.maps.LatLngLiteral {
  return { lat: p[0], lng: p[1] };
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function pointAlong(points: [number, number][], t: number): [number, number] {
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + haversineKm(points[i - 1], points[i]));
  }
  const total = cum[cum.length - 1] || 0.1;
  const target = Math.min(Math.max(t, 0), 1) * total;
  let i = 0;
  while (i < points.length - 2 && cum[i + 1] < target) i++;
  const segLen = cum[i + 1] - cum[i];
  const f =
    segLen > 0 ? Math.min(Math.max((target - cum[i]) / segLen, 0), 1) : 0;
  return [
    lerp(points[i][0], points[i + 1][0], f),
    lerp(points[i][1], points[i + 1][1], f),
  ];
}

function placeIcon(color: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">` +
    `<circle cx="6" cy="6" r="5" fill="${color}" stroke="${DARK}" stroke-width="1.5"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function RouteMap({
  trek,
  active = null,
  onSelect,
}: {
  trek: RouteContent;
  active?: number | null;
  onSelect?: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const readyRef = useRef(false);
  const activeRef = useRef(active);
  const onSelectRef = useRef(onSelect);
  const placeMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const lastDayRef = useRef<number | null>(null);
  const flyTokenRef = useRef(0);
  const initDoneRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const path = trek.path;

  const wps = useMemo(
    () => trailWaypoints[trek.slug] ?? [],
    [trek.slug],
  );
  const flyTo = useCallback(
    (
      from: [number, number] | null,
      to: [number, number],
      mid: [number, number][],
    ) => {
      const map = mapRef.current;
      if (!map) return;
      const pts: [number, number][] = from ? [from, ...mid, to] : [to];
      const startZoom = map.getZoom();
      const baseZoom = startZoom !== undefined ? startZoom : 16;
      const toZoom = Math.max(baseZoom, 16);
      const farZoom = Math.max(6, Math.min(baseZoom, toZoom) - 4);

      if (pts.length < 2) {
        map.panTo(ll(to));
        if (toZoom !== baseZoom) map.setZoom(toZoom);
        return;
      }

      const cum: number[] = [0];
      for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + haversineKm(pts[i - 1], pts[i]));
      }
      const total = cum[cum.length - 1] || 0.1;
      const zoomOutTime = 1100;
      const flyTime = Math.min(Math.max(1200 + total * 160, 1200), 2600);
      const holdTime = 2000;
      const zoomInTime = 900;
      const arrive = zoomOutTime + flyTime;
      const holdEnd = arrive + holdTime;
      const zoomInEnd = holdEnd + zoomInTime;
      const token = ++flyTokenRef.current;
      const start = performance.now();

      const frame = (now: number) => {
        if (token !== flyTokenRef.current) return;
        const elapsed = now - start;
        const move = Math.min(elapsed / arrive, 1);
        const target = easeInOutCubic(move) * total;
        let i = 0;
        while (i < pts.length - 2 && cum[i + 1] < target) i++;
        const segLen = cum[i + 1] - cum[i];
        const f =
          segLen > 0 ? Math.min(Math.max((target - cum[i]) / segLen, 0), 1) : 0;
        let zoom = farZoom;
        if (elapsed < zoomOutTime) {
          zoom = lerp(baseZoom, farZoom, elapsed / zoomOutTime);
        } else if (elapsed >= holdEnd && elapsed < zoomInEnd) {
          zoom = lerp(farZoom, toZoom, (elapsed - holdEnd) / zoomInTime);
        } else if (elapsed >= zoomInEnd) {
          zoom = toZoom;
        }
        try {
          map.moveCamera({
            center: {
              lat: lerp(pts[i][0], pts[i + 1][0], f),
              lng: lerp(pts[i][1], pts[i + 1][1], f),
            },
            zoom,
          });
        } catch {
          // ignore
        }
        if (elapsed < zoomInEnd) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    },
    [],
  );

  const applyActive = useCallback(
    (index: number | null) => {
      const map = mapRef.current;
      const gm = window.google?.maps;
      if (!map || !gm) return;
      if (index === null) {
        if (boundsRef.current) map.fitBounds(boundsRef.current);
        lastDayRef.current = null;
        return;
      }
      const to = path[index];
      if (!to) return;
      const from =
        lastDayRef.current != null && lastDayRef.current !== index
          ? path[lastDayRef.current]
          : null;
      lastDayRef.current = index;
      flyTo(from, to, wps[index] ?? []);
    },
    [path, wps, flyTo],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((gm) => {
        if (cancelled) return;

        const map = new gm.Map(el, {
          center: ll(trek.coordinates),
          zoom: 9,
          mapTypeId: gm.MapTypeId.HYBRID,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        map.addListener("dragstart", () => {
          flyTokenRef.current++;
        });

        getTrekLabels(trek).forEach((p) => {
          const color = PLACE_COLORS[p.kind] ?? "#d3dae4";
          const marker = new gm.Marker({
            position: ll([p.lat, p.lng]),
            map,
            icon: { url: placeIcon(color), anchor: new gm.Point(6, 6) },
            title: p.name,
            zIndex: 1,
          });
          marker.addListener("click", () => {
            infoWindowRef.current?.close();
            const label = p.kind.charAt(0).toUpperCase() + p.kind.slice(1);
            infoWindowRef.current = new gm.InfoWindow({
              content:
                `<div style="min-width:120px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">` +
                `<div style="font-size:14px;font-weight:600;line-height:1.2">${p.name}</div>` +
                `<div style="margin-top:3px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#666">${label} · ${trek.name}</div>` +
                `</div>`,
            });
            infoWindowRef.current.open({ map, anchor: marker });
          });
          placeMarkersRef.current.push(marker);
        });

        const bounds = new gm.LatLngBounds();
        for (const p of path) bounds.extend(ll(p));
        boundsRef.current = bounds;

        readyRef.current = true;
        const warmFar = Math.max(6, 16 - 4);
        const warmToken = ++flyTokenRef.current;
        map.setZoom(warmFar);
        const warmStart = performance.now();
        const warmDur = 900;
        const warm = (now: number) => {
          if (warmToken !== flyTokenRef.current) return;
          const t = Math.min((now - warmStart) / warmDur, 1);
          map.setCenter(ll(pointAlong(path, easeInOutCubic(t))));
          if (t < 1) {
            requestAnimationFrame(warm);
          } else {
            applyActive(activeRef.current);
            initDoneRef.current = true;
          }
        };
        requestAnimationFrame(warm);
      })
      .catch(() => {
        if (cancelled) return;
        el.innerHTML =
          '<div style="display:grid;place-items:center;height:100%;color:#888;font-size:12px">Map unavailable</div>';
      });

    return () => {
      cancelled = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      flyTokenRef.current++;
      readyRef.current = false;
      placeMarkersRef.current.forEach((m) => m.setMap(null));
      placeMarkersRef.current = [];
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    if (!initDoneRef.current) return;
    if (active === lastDayRef.current) return;
    if (active === null) {
      applyActive(null);
      return;
    }
    const t = window.setTimeout(() => applyActive(active), 400);
    return () => window.clearTimeout(t);
  }, [active, applyActive]);

  const zoomBy = useCallback((d: number) => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    if (zoom !== undefined) map.setZoom(zoom + d);
  }, []);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    infoWindowRef.current?.close();
    if (boundsRef.current) map.fitBounds(boundsRef.current);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div
        className="absolute right-2 top-2 z-[1000] flex flex-col gap-1.5"
        role="group"
        aria-label="Map controls"
      >
        <MapButton onClick={() => zoomBy(1)} label="Zoom in">+</MapButton>
        <MapButton onClick={() => zoomBy(-1)} label="Zoom out">−</MapButton>
        <MapButton onClick={resetView} label="Reset view">⌂</MapButton>
      </div>
    </div>
  );
}

function MapButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-night/80 text-sm leading-none text-snow/80 backdrop-blur-sm transition-colors hover:border-line-strong hover:text-snow"
    >
      {children}
    </button>
  );
}
