"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Trek } from "@/data/treks";
import { trailWaypoints, getTrekLabels } from "@/data/dayViews";

const AIR_KM = 45;
const DARK = "#0a0e14";
const NEPAL: [number, number] = [84.1, 28.35];

export interface NepalMapProps {
  treks: Trek[];
  activeSlug?: string | null;
  onSelect?: (slug: string) => void;
}

function ll(p: [number, number]): [number, number] {
  return [p[1], p[0]];
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

function raceRoute(trek: Trek) {
  const wps = trailWaypoints[trek.slug] ?? [];
  const path = trek.path;
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
  const walk: number[][][] = [];
  const air: number[][][] = [];
  let cur: number[][] = [];
  let curType: "walk" | "air" | null = null;
  for (const seg of segs) {
    if (
      seg.points[0][0] === seg.points[1][0] &&
      seg.points[0][1] === seg.points[1][1]
    )
      continue;
    const type = seg.air ? "air" : "walk";
    const pts = seg.points.map((p) => ll(p));
    if (curType !== type) {
      if (cur.length) (curType === "walk" ? walk : air).push(cur);
      cur = [...pts];
      curType = type;
    } else {
      cur.push(...pts.slice(1));
    }
  }
  if (cur.length) (curType === "walk" ? walk : air).push(cur);
  return { walk, air };
}

export default function NepalMap({
  treks,
  activeSlug = null,
  onSelect,
}: NepalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const activeRef = useRef(activeSlug);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    activeRef.current = activeSlug;
  }, [activeSlug]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const routesGeo = useMemo(() => {
    const features: {
      type: "Feature";
      properties: { slug: string; air?: boolean };
      geometry: { type: "LineString"; coordinates: number[][] };
    }[] = [];
    for (const trek of treks) {
      const { walk, air } = raceRoute(trek);
      for (const coords of walk)
        features.push({
          type: "Feature",
          properties: { slug: trek.slug },
          geometry: { type: "LineString", coordinates: coords },
        });
      for (const coords of air)
        features.push({
          type: "Feature",
          properties: { slug: trek.slug, air: true },
          geometry: { type: "LineString", coordinates: coords },
        });
    }
    return { type: "FeatureCollection", features };
  }, [treks]);

  const placesGeo = useMemo(() => {
    const features = treks.flatMap((trek) =>
      getTrekLabels(trek).map((p) => ({
        type: "Feature",
        properties: { name: p.name, kind: p.kind, slug: trek.slug },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    );
    return { type: "FeatureCollection", features };
  }, [treks]);

  const activeSlugMemo = activeSlug;

  const activeRouteGeo = useMemo(() => {
    const trek = treks.find((t) => t.slug === activeSlugMemo);
    if (!trek) return empty;
    const { walk } = raceRoute(trek);
    return {
      type: "FeatureCollection",
      features: walk.map((coords) => ({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      })),
    };
  }, [treks, activeSlugMemo]);

  const daysGeo = useMemo(() => {
    const trek = treks.find((t) => t.slug === activeSlugMemo);
    if (!trek) return empty;
    return {
      type: "FeatureCollection",
      features: trek.itinerary.map((d, i) => ({
        type: "Feature",
        id: i,
        properties: { day: d.day, kind: d.kind, air: d.kind === "travel" },
        geometry: { type: "Point", coordinates: ll(trek.path[i]) },
      })),
    };
  }, [treks, activeSlugMemo]);

  const style = useMemo(() => {
    const accent = "#f59e0b";
    const ice = "#7dd3fc";
    const muted = "#93a3b5";
    return {
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
        routes: { type: "geojson", data: routesGeo },
        active: { type: "geojson", data: activeRouteGeo },
        places: { type: "geojson", data: placesGeo },
        days: { type: "geojson", data: daysGeo },
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
          paint: { "raster-fade-duration": 0, "raster-opacity": 0.9 },
        },
        {
          id: "route-air",
          type: "line",
          source: "routes",
          filter: ["==", ["get", "air"], true],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": muted,
            "line-width": 1.5,
            "line-opacity": 0.6,
            "line-dasharray": [2, 2],
          },
        },
        {
          id: "route-walk",
          type: "line",
          source: "routes",
          filter: ["!=", ["get", "air"], true],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#dfe6ee",
            "line-width": 1.8,
            "line-opacity": 0.5,
          },
        },
        {
          id: "active-route",
          type: "line",
          source: "active",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": accent,
            "line-width": 3.5,
            "line-opacity": 0.95,
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
          minzoom: 8,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Semibold"],
            "text-size": 12,
            "text-anchor": "top",
            "text-offset": [0, 0.6],
            "text-max-width": 12,
            "icon-allow-overlap": false,
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(6,10,16,0.85)",
            "text-halo-width": 1.6,
          },
        },
        {
          id: "day-dot",
          type: "circle",
          source: "days",
          paint: {
            "circle-radius": 8,
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
            "circle-opacity": 0.9,
            "circle-stroke-color": DARK,
            "circle-stroke-width": 1.5,
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
            "text-color": DARK,
            "text-halo-color": "rgba(255,255,255,0.9)",
            "text-halo-width": 1.5,
          },
        },
      ],
    } as unknown as maplibregl.StyleSpecification;
  }, [routesGeo, activeRouteGeo, placesGeo, daysGeo]);

  const closePopup = useCallback(() => {
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  const warmTiles = useCallback(
    (centers: [number, number][], zooms: number[]) => {
      const sat =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const uris = new Set<string>();
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
                sat
                  .replace("{z}", String(z))
                  .replace("{y}", String(y + dy))
                  .replace("{x}", String(x + dx)),
              );
            }
        }
      }
      const list = [...uris].slice(0, 36);
      let next = 0;
      for (let i = 0; i < 6; i++) {
        (async () => {
          while (next < list.length) {
            const u = list[next++];
            try {
              await fetch(u, { mode: "cors", priority: "low" });
            } catch {
              // best-effort
            }
          }
        })();
      }
    },
    [],
  );

  const activeTrek = useMemo(
    () => treks.find((t) => t.slug === activeSlugMemo) ?? null,
    [treks, activeSlugMemo],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = new maplibregl.Map({
      container: el,
      style,
      center: NEPAL,
      zoom: 7.5,
      minZoom: 4,
      maxZoom: 18,
      pitch: 0,
      bearing: 0,
      maxPitch: 30,
      pixelRatio: 2,
      fadeDuration: 0,
      maxTileCacheSize: 400,
      attributionControl: false,
      scrollZoom: false,
      dragRotate: true,
      touchPitch: true,
      touchZoomRotate: true,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;
    (el as HTMLDivElement & { __map?: maplibregl.Map }).__map = map;

    map.on("click", "route-walk", (e: maplibregl.MapLayerMouseEvent) => {
      const slug = e.features?.[0]?.properties?.slug as string | undefined;
      if (slug) onSelectRef.current?.(slug);
    });
    map.on("click", "route-air", (e: maplibregl.MapLayerMouseEvent) => {
      const slug = e.features?.[0]?.properties?.slug as string | undefined;
      if (slug) onSelectRef.current?.(slug);
    });
    map.on("click", "place-dot", (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      const props = f?.properties;
      if (!props?.name) return;
      const trek = treks.find((t) => t.slug === props.slug);
      const label = String(props.kind).charAt(0).toUpperCase() + String(props.kind).slice(1);
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        className: "map-popup",
      })
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .setHTML(`
          <div style="min-width:128px">
            <div style="font-size:15px;font-weight:500;color:var(--color-snow);line-height:1.15">${props.name}</div>
            <div style="margin-top:3px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--color-mist)">${label} · ${trek?.name ?? ""}</div>
          </div>`)
        .addTo(map);
    });
    for (const layer of ["route-walk", "route-air", "place-dot"]) {
      map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
    }
    map.on("click", () => closePopup());

    let done = false;
    const ready = () => {
      if (done) return;
      done = true;
      void fetch(
        "https://demotiles.maplibre.org/font/Open%20Sans%20Semibold/0-255.pbf",
        { mode: "cors", priority: "low" },
      ).catch(() => {});
      if (activeRef.current) {
        const t = treks.find((x) => x.slug === activeRef.current);
        if (t) warmTiles([t.coordinates], [11.5, 12.5]);
      }
    };
    map.on("load", ready);
    map.on("idle", ready);
    const fallback = window.setTimeout(ready, 2500);

    return () => {
      clearTimeout(fallback);
      map.off("load", ready);
      map.off("idle", ready);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    closePopup();
    if (activeTrek) {
      map.easeTo({
        center: ll(activeTrek.coordinates),
        zoom: 12,
        pitch: 0,
        bearing: 0,
        duration: 1100,
      });
      warmTiles([activeTrek.coordinates], [11.5, 12.5]);
    } else {
      map.easeTo({
        center: NEPAL,
        zoom: 7.5,
        pitch: 0,
        bearing: 0,
        duration: 900,
      });
    }
  }, [activeSlug, activeTrek, warmTiles, closePopup]);

  const zoomBy = useCallback(
    (d: number) => {
      const map = mapRef.current;
      if (!map) return;
      map.zoomTo(map.getZoom() + d, { duration: 250 });
    },
    [],
  );

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    closePopup();
    map.easeTo({
      center: NEPAL,
      zoom: 7.5,
      pitch: 0,
      bearing: 0,
      duration: 900,
    });
  }, [closePopup]);

  const mapsUrl = useMemo(() => {
    const [lat, lng] = activeTrek
      ? activeTrek.coordinates
      : (NEPAL.slice().reverse() as [number, number]);
    return `https://maps.google.com/?q=${lat},${lng}`;
  }, [activeTrek]);

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
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in maps app"
          title="Open in maps app"
          className="flex h-8 items-center gap-1 rounded-lg border border-line bg-night/80 px-2 text-[11px] font-medium tracking-wide text-snow/80 backdrop-blur-sm transition-colors hover:border-line-strong hover:text-snow"
        >
          <OpenInMapsIcon />
          Maps
        </a>
      </div>
    </div>
  );
}

const empty = {
  type: "FeatureCollection",
  features: [],
};

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

function OpenInMapsIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}