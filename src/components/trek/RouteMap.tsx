"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Trek } from "@/data/treks";
import { trailWaypoints, trekLabels } from "@/data/dayViews";

const AIR_KM = 45;
const DARK = "#0a0e14";
const KTM: [number, number] = [27.7172, 85.324];

function ll(p: [number, number]): [number, number] {
  return [p[1], p[0]];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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

function useCssVars() {
  const [vars, setVars] = useState({
    accent: "#f59e0b",
    ice: "#7dd3fc",
    muted: "#93a3b5",
  });
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      setVars({
        accent: cs.getPropertyValue("--accent").trim() || "#f59e0b",
        ice: cs.getPropertyValue("--accent-ice").trim() || "#7dd3fc",
        muted: cs.getPropertyValue("--ink-muted").trim() || "#93a3b5",
      });
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, []);
  return vars;
}

export default function RouteMap({
  trek,
  active = null,
  onSelect,
}: {
  trek: Trek;
  active?: number | null;
  onSelect?: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const reduce = !!useReducedMotion();
  const { accent, ice, muted } = useCssVars();

  const days = trek.itinerary;
  const path = trek.path;

  const wps = useMemo(
    () => trailWaypoints[trek.slug] ?? [],
    [trek.slug],
  );

  const placesGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: (trekLabels[trek.slug] ?? []).map((p) => ({
        type: "Feature" as const,
        properties: { name: p.name, kind: p.kind },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lng, p.lat],
        },
      })),
    }),
    [trek.slug],
  );

  const emptySegment = useMemo(
    () =>
      ({
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: [] },
      }) as const,
    [],
  );

  const accentRef = useRef(accent);
  const iceRef = useRef(ice);
  const mutedRef = useRef(muted);
  const activeRef = useRef(active);
  const onSelectRef = useRef(onSelect);
  const reduceRef = useRef(reduce);
  useEffect(() => {
    accentRef.current = accent;
    iceRef.current = ice;
    mutedRef.current = muted;
  }, [accent, ice, muted]);
  useEffect(() => {
    activeRef.current = active;
    reduceRef.current = reduce;
  }, [active, reduce]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const segments = useMemo(() => {
    const segs: { points: [number, number][]; air: boolean }[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const mid = wps[i + 1] ?? [];
      segs.push({
        points: [a, ...mid, b],
        air: haversineKm(a, b) > AIR_KM,
      });
    }
    return segs;
  }, [path, wps]);

  const routeGeo = useMemo(() => {
    const walk: number[][][] = [];
    const air: number[][][] = [];
    let cur: number[][] = [];
    let curType: "walk" | "air" | null = null;
    for (const seg of segments) {
      if (
        seg.points[0][0] === seg.points[1][0] &&
        seg.points[0][1] === seg.points[1][1]
      )
        continue;
      const type = seg.air ? "air" : "walk";
      const pts = seg.points.map((p) => [p[1], p[0]]);
      if (curType !== type) {
        if (cur.length) (curType === "walk" ? walk : air).push(cur);
        cur = [...pts];
        curType = type;
      } else {
        cur.push(...pts.slice(1));
      }
    }
    if (cur.length) (curType === "walk" ? walk : air).push(cur);
    return {
      type: "FeatureCollection" as const,
      features: [
        ...walk.map((coords) => ({
          type: "Feature" as const,
          properties: { air: false },
          geometry: { type: "LineString" as const, coordinates: coords },
        })),
        ...air.map((coords) => ({
          type: "Feature" as const,
          properties: { air: true },
          geometry: { type: "LineString" as const, coordinates: coords },
        })),
      ],
    };
  }, [segments]);

  const daysGeo = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: days.map((d, i) => ({
        type: "Feature" as const,
        id: i,
        properties: {
          day: d.day,
          kind: d.kind,
          air: d.kind === "travel",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [path[i][1], path[i][0]],
        },
      })),
    };
  }, [days, path]);

  const style = useMemo(
    () =>
      ({
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 18,
            attribution: "Esri, Maxar, Earthstar Geographics",
          },
          labels: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          route: { type: "geojson", data: routeGeo },
          days: { type: "geojson", data: daysGeo },
          places: { type: "geojson", data: placesGeo },
          segment: { type: "geojson", data: emptySegment },
          terrain: {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 15,
            encoding: "terrarium",
            attribution: "© AWS Open Data · Terrain Tiles",
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
            paint: { "raster-fade-duration": 0 },
          },
          {
            id: "labels",
            type: "raster",
            source: "labels",
            paint: {
              "raster-fade-duration": 0,
              "raster-opacity": 0.9,
            },
          },
          {
            id: "day-segment",
            type: "line",
            source: "segment",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": accent,
              "line-width": 5,
              "line-opacity": 0.95,
            },
          },
          {
            id: "route-walk",
            type: "line",
            source: "route",
            filter: ["==", ["get", "air"], false],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": accent,
              "line-width": 3,
              "line-opacity": 0.95,
            },
          },
          {
            id: "route-air",
            type: "line",
            source: "route",
            filter: ["==", ["get", "air"], true],
            paint: {
              "line-color": muted,
              "line-width": 1.5,
              "line-opacity": 0.6,
              "line-dasharray": [2, 2],
            },
          },
          {
            id: "place-dot",
            type: "circle",
            source: "places",
            paint: {
              "circle-radius": [
                "match",
                ["get", "kind"],
                "village",
                4,
                "city",
                4.5,
                "river",
                4,
                5,
              ],
              "circle-color": [
                "match",
                ["get", "kind"],
                "peak",
                accent,
                "basecamp",
                ice,
                "lake",
                "#60a5fa",
                "monastery",
                "#c084fc",
                "pass",
                "#94a3b8",
                "city",
                "#e8edf4",
                "river",
                "#38bdf8",
                "#d3dae4",
              ],
              "circle-stroke-color": DARK,
              "circle-stroke-width": 1.5,
              "circle-opacity": 0.95,
            },
          },
          {
            id: "place-labels",
            type: "symbol",
            source: "places",
            layout: {
              "text-field": ["get", "name"],
              "text-font": ["Open Sans Semibold"],
              "text-size": 11.5,
              "text-anchor": "top",
              "text-offset": [0, 0.6],
              "text-max-width": 11,
              "icon-allow-overlap": true,
              "text-allow-overlap": true,
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "rgba(6,10,16,0.85)",
              "text-halo-width": 1.6,
            },
          },
          {
            id: "day-halo",
            type: "circle",
            source: "days",
            paint: {
              "circle-radius": 17,
              "circle-color": accent,
              "circle-opacity": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                0.35,
                0,
              ],
            },
          },
          {
            id: "day-dot",
            type: "circle",
            source: "days",
            paint: {
              "circle-radius": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                11,
                8,
              ],
              "circle-color": [
                "match",
                ["get", "kind"],
                "summit",
                accent,
                "acclimatization",
                ice,
                "travel",
                muted,
                accent,
              ],
              "circle-opacity": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                1,
                0.9,
              ],
              "circle-stroke-color": DARK,
              "circle-stroke-width": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                2,
                1.5,
              ],
            },
          },
          {
            id: "day-label",
            type: "symbol",
            source: "days",
            layout: {
              "text-field": ["get", "day"],
              "text-font": ["Open Sans Semibold"],
              "text-size": 11,
            },
            paint: {
              "text-color": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                "#ffffff",
                DARK,
              ],
              "text-halo-color": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                "rgba(0,0,0,0.85)",
                "rgba(255,255,255,0.9)",
              ],
              "text-halo-width": [
                "case",
                ["boolean", ["feature-state", "active"], false],
                2,
                1.5,
              ],
            },
          },
        ],
      }) as unknown as maplibregl.StyleSpecification,
    [accent, ice, muted, routeGeo, daysGeo, placesGeo, emptySegment],
  );

  const applyColors = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setPaintProperty("route-walk", "line-color", accent);
      map.setPaintProperty("route-air", "line-color", muted);
      map.setPaintProperty("day-segment", "line-color", accent);
      map.setPaintProperty("day-halo", "circle-color", accent);
      map.setPaintProperty("day-dot", "circle-color", [
        "match",
        ["get", "kind"],
        "summit",
        accent,
        "acclimatization",
        ice,
        "travel",
        muted,
        accent,
      ]);
    } catch {
      // style not ready yet
    }
  }, [accent, ice, muted]);

  const flightRef = useRef(0);
  const dashRef = useRef<number | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const closePopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const openPlace = useCallback(
    (lngLat: { lng: number; lat: number }, name: string, kind: string) => {
      const label = kind.charAt(0).toUpperCase() + kind.slice(1);
      const html = `
        <div style="min-width:120px">
          <div style="font-size:15px;font-weight:500;color:var(--color-snow);line-height:1.15">${name}</div>
          <div style="margin-top:3px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--color-mist)">${label}</div>
        </div>`;
      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        className: "map-popup",
      })
        .setLngLat([lngLat.lng, lngLat.lat])
        .setHTML(html);
      popupRef.current?.remove();
      popupRef.current = popup;
      popup.addTo(mapRef.current!);
    },
    [],
  );

  const stopDash = useCallback((map: maplibregl.Map) => {
    if (dashRef.current !== null) {
      cancelAnimationFrame(dashRef.current);
      dashRef.current = null;
    }
    try {
      map.setPaintProperty("day-segment", "line-dasharray", undefined);
    } catch {
      // style not ready yet
    }
  }, []);

  const warmTiles = useCallback(
    (centers: [number, number][], zooms: number[]) => {
      if (reduceRef.current) return;
      const uris = new Set<string>();
      const sat =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      for (const [lat, lng] of centers) {
        for (const z of zooms) {
          const m = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], z);
          const n = Math.pow(2, z);
          const x = Math.floor(m.x * n);
          const y = Math.floor(m.y * n);
          for (const dx of [-1, 0, 1])
            for (const dy of [-1, 0, 1]) {
              if (x + dx < 0 || y + dy < 0 || x + dx >= n || y + dy >= n)
                continue;
              uris.add(
                sat.replace("{z}", String(z)).replace("{y}", String(y + dy)).replace("{x}", String(x + dx)),
              );
            }
        }
      }
      const list = [...uris].slice(0, 36);
      let next = 0;
      const workers = Array.from({ length: 6 }, () =>
        (async () => {
          while (next < list.length) {
            const u = list[next++];
            try {
              await fetch(u, { mode: "cors", priority: "low" });
            } catch {
              // best-effort warming
            }
          }
        })(),
      );
      void Promise.all(workers);
    },
    [],
  );

  const runDash = useCallback((map: maplibregl.Map) => {
    if (dashRef.current !== null) return;
    let phase = 0;
    const frame = () => {
      phase += 0.35;
      try {
        map.setPaintProperty("day-segment", "line-dasharray", [
          phase % 2.5,
          1.5,
        ]);
      } catch {
        // ignore
      }
      dashRef.current = requestAnimationFrame(frame);
    };
    dashRef.current = requestAnimationFrame(frame);
  }, []);

  const followTrail = useCallback(
    (
      map: maplibregl.Map,
      pts: [number, number][],
      totalKm: number,
      token: number,
    ) => {
      const cum: number[] = [0];
      for (let i = 1; i < pts.length; i++) {
        cum.push(
          cum[i - 1] +
            haversineKm([pts[i][1], pts[i][0]], [pts[i - 1][1], pts[i - 1][0]]),
        );
      }
      const total = cum[cum.length - 1] || totalKm;
      const duration = Math.min(Math.max(4200 + total * 260, 4200), 8500);
      const start = performance.now();
      runDash(map);
      const frame = (now: number) => {
        if (token !== flightRef.current) return;
        const t = Math.min((now - start) / duration, 1);
        const e = easeInOutCubic(t);
        const target = e * total;
        let i = 0;
        while (i < pts.length - 2 && cum[i + 1] < target) i++;
        const segLen = cum[i + 1] - cum[i];
        const f = segLen > 0 ? Math.min(Math.max((target - cum[i]) / segLen, 0), 1) : 0;
        const center: [number, number] = [
          lerp(pts[i][0], pts[i + 1][0], f),
          lerp(pts[i][1], pts[i + 1][1], f),
        ];
        const zoom =
          t < 0.14
            ? lerp(14.4, 14.0, t / 0.14)
            : t < 0.86
              ? 14.0
              : lerp(14.0, 14.4, (t - 0.86) / 0.14);
        try {
          map.jumpTo({ center, zoom, pitch: 58, bearing: 20 });
        } catch {
          // ignore
        }
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          stopDash(map);
          try {
            map.easeTo({
              center: pts[pts.length - 1],
              zoom: 14.4,
              pitch: 58,
              bearing: 20,
              duration: 700,
            });
          } catch {
            // ignore
          }
        }
      };
      requestAnimationFrame(frame);
    },
    [runDash, stopDash],
  );

  const applyActive = useCallback(
    (index: number | null) => {
      const map = mapRef.current;
      if (!map || index === null) return;
      const token = ++flightRef.current;
      stopDash(map);
      closePopup();
      try {
        for (let i = 0; i < days.length; i++) {
          map.setFeatureState(
            { source: "days", id: i },
            { active: i === index },
          );
        }
        const from: [number, number] =
          index === 0 ? KTM : path[index - 1];
        const to = path[index];
        const mid = wps[index] ?? [];
        const pts: [number, number][] = [
          ll(from),
          ...mid.map((p) => ll(p)),
          ll(to),
        ];
        const seg = map.getSource("segment") as
          | maplibregl.GeoJSONSource
          | undefined;
        seg?.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: pts },
        });

        if (reduceRef.current) {
          map.easeTo({
            center: ll(to),
            zoom: 11.5,
            pitch: 58,
            bearing: 20,
            duration: 0,
          });
          return;
        }

        const dist = haversineKm(from, to);
        warmTiles([from, ...mid, to], dist < 0.15 ? [15.6] : [15.2, 14.2]);
        if (dist < 0.15) {
          const kfs = [
            { center: ll(to), zoom: 14.6, pitch: 58, bearing: 20, duration: 1500 },
            { center: ll(to), zoom: 12.6, pitch: 58, bearing: 20, duration: 1200 },
            { center: ll(to), zoom: 14.6, pitch: 58, bearing: 20, duration: 1500 },
          ];
          runDash(map);
          let i = 0;
          const step = () => {
            if (token !== flightRef.current) return;
            if (i >= kfs.length) {
              stopDash(map);
              return;
            }
            const kf = kfs[i++];
            try {
              map.easeTo({ ...kf, essential: true });
              map.once("moveend", step);
            } catch {
              step();
            }
          };
          step();
          return;
        }

        if (dist > AIR_KM) {
          const az = dist > 60 ? 8 : 10.5;
          const kfs = [
            { center: ll(from), zoom: az, pitch: 0, bearing: 0, duration: 900 },
            { center: ll(to), zoom: az, pitch: 0, bearing: 0, duration: 1100 },
            { center: ll(to), zoom: 13.8, pitch: 58, bearing: 20, duration: 900 },
          ];
          runDash(map);
          let i = 0;
          const step = () => {
            if (token !== flightRef.current) return;
            if (i >= kfs.length) {
              stopDash(map);
              return;
            }
            const kf = kfs[i++];
            try {
              map.easeTo({ ...kf, essential: true });
              map.once("moveend", step);
            } catch {
              step();
            }
          };
          step();
          return;
        }

        followTrail(map, pts, dist, token);
      } catch {
        // style not ready yet; retried when the map reports ready
      }
    },
    [days, path, wps, runDash, stopDash, followTrail, warmTiles, closePopup],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style,
      center: [trek.coordinates[1], trek.coordinates[0]],
      zoom: 9,
      minZoom: 5,
      maxZoom: 18,
      pitch: 55,
      bearing: 20,
      maxPitch: 85,
      pixelRatio: 2,
      fadeDuration: 0,
      maxTileCacheSize: 400,
      attributionControl: false,
      scrollZoom: false,
      dragRotate: true,
      touchPitch: true,
      touchZoomRotate: true,
    });
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    mapRef.current = map;
    (el as HTMLDivElement & { __map?: maplibregl.Map }).__map = map;

    map.on("click", "day-dot", (e: maplibregl.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.id as number | undefined;
      if (typeof id === "number") onSelectRef.current?.(id);
    });
    map.on("click", "place-dot", (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      const name = f?.properties?.name as string | undefined;
      const kind = f?.properties?.kind as string | undefined;
      if (name) openPlace(e.lngLat, name, kind ?? "place");
    });
    map.on("mouseenter", "day-dot", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "day-dot", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "place-dot", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "place-dot", () => {
      map.getCanvas().style.cursor = "";
    });

    let done = false;
    const ready = () => {
      if (done) return;
      done = true;
      readyRef.current = true;
      try {
        map.setTerrain({ source: "terrain", exaggeration: 1.1 });
        map.setSky({
          "sky-color": "#0b0f1e",
          "horizon-color": "#181f33",
          "fog-color": "#0a0e14",
          "fog-ground-blend": 0.55,
        });
      } catch {
        // terrain/sky optional
      }
      applyColors();
      warmTiles(
        trek.path.slice(0, -1).map((p) => [p[0], p[1]]),
        [10, 12],
      );
      void fetch(
        "https://demotiles.maplibre.org/font/Open%20Sans%20Semibold/0-255.pbf",
        { mode: "cors", priority: "low" },
      ).catch(() => {});
      applyActive(activeRef.current);
    };
    map.on("load", ready);
    map.on("idle", ready);
    const fallback = window.setTimeout(ready, 2500);

    return () => {
      clearTimeout(fallback);
      map.off("load", ready);
      map.off("idle", ready);
      if (dashRef.current !== null) cancelAnimationFrame(dashRef.current);
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyColors();
  }, [applyColors]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyActive(active);
  }, [active, applyActive]);

  const zoomBy = useCallback(
    (d: number) => {
      const map = mapRef.current;
      if (!map) return;
      closePopup();
      ++flightRef.current;
      stopDash(map);
      map.zoomTo(map.getZoom() + d, { duration: 250 });
    },
    [closePopup, stopDash],
  );

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    closePopup();
    ++flightRef.current;
    stopDash(map);
    map.easeTo({
      center: [trek.coordinates[1], trek.coordinates[0]],
      zoom: 9.5,
      pitch: 50,
      bearing: 20,
      duration: 900,
    });
  }, [closePopup, stopDash, trek.coordinates]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />
      <div
        className="absolute right-2 top-2 z-[1000] flex flex-col gap-1.5"
        role="group"
        aria-label="Map controls"
      >
        <MapButton onClick={() => zoomBy(1)} label="Zoom in">
          +
        </MapButton>
        <MapButton onClick={() => zoomBy(-1)} label="Zoom out">
          −
        </MapButton>
        <MapButton onClick={resetView} label="Reset view">
          ⌂
        </MapButton>
      </div>
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-[1000] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-line bg-night/80 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-snow/70 backdrop-blur-sm"
        aria-hidden
      >
        <span className="flex items-center gap-1.5">
          <span className="block h-0.5 w-4 bg-snow/80" aria-hidden />
          walk
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="block w-4 border-t border-dashed border-snow/60"
            aria-hidden
          />
          fly / drive
        </span>
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
