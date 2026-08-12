"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/data/treks";

const FROM_COLOR = "#93a3b5";
const TO_COLOR = "#f59e0b";
const DARK = "#0a0e14";

type Hit = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

function valid(p?: Place | null): p is Place {
  return Boolean(
    p &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      !(p.lat === 0 && p.lng === 0),
  );
}

function pinSvg(num: number, color: string) {
  const r = 11;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="${color}" stroke="${DARK}" stroke-width="2"/>` +
    `<text x="${r}" y="${r + 4}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="${DARK}">${num}</text>` +
    `</svg>`;
  return svg;
}

const fieldCls =
  "rounded-lg border border-line-strong bg-night px-3 py-2 text-sm text-snow outline-none transition-colors focus:border-saffron";
const labelCls = "text-[10px] uppercase tracking-[0.18em] text-mist";

export default function DayMap({
  from,
  to,
  single,
  onPlace,
}: {
  from: Place;
  to: Place;
  single: boolean;
  onPlace: (which: "from" | "to", patch: Partial<Place>) => void;
}) {
  const fromLat = from.lat;
  const fromLng = from.lng;
  const toLat = to.lat;
  const toLng = to.lng;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const lineRef = useRef<L.Polyline | null>(null);
  const onPlaceRef = useRef(onPlace);
  const singleRef = useRef(single);
  const targetRef = useRef<"from" | "to">("from");
  const lastFitKeyRef = useRef("");
  const seqRef = useRef(0);
  const timerRef = useRef(0);

  const [target, setTarget] = useState<"from" | "to">("from");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onPlaceRef.current = onPlace;
  });
  useEffect(() => {
    singleRef.current = single;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = L.map(el, {
      center: [28.2, 84.1],
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19,
      },
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      const patch = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (singleRef.current) onPlaceRef.current("from", patch);
      else onPlaceRef.current(targetRef.current, patch);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    lineRef.current?.remove();
    lineRef.current = null;

    const pts: [number, number][] = [];
    if (!single && valid({ lat: fromLat, lng: fromLng } as Place))
      pts.push([fromLat, fromLng]);
    if (valid({ lat: toLat, lng: toLng } as Place)) pts.push([toLat, toLng]);

    if (!single && valid({ lat: fromLat, lng: fromLng } as Place)) {
      const m = L.marker([fromLat, fromLng], {
        icon: L.divIcon({
          className: "stn-pin",
          html: pinSvg(1, FROM_COLOR),
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        draggable: true,
        zIndexOffset: 20,
      }).addTo(map);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        onPlaceRef.current("from", { lat: ll.lat, lng: ll.lng });
      });
      markersRef.current.push(m);
    }

    const toPos = single
      ? ({ lat: fromLat, lng: fromLng } as Place)
      : ({ lat: toLat, lng: toLng } as Place);
    if (valid(toPos)) {
      const m = L.marker([toPos.lat, toPos.lng], {
        icon: L.divIcon({
          className: "stn-pin",
          html: pinSvg(single ? 1 : 2, TO_COLOR),
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        draggable: true,
        zIndexOffset: 20,
      }).addTo(map);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        onPlaceRef.current(single ? "from" : "to", {
          lat: ll.lat,
          lng: ll.lng,
        });
      });
      markersRef.current.push(m);
    }

    if (
      !single &&
      valid({ lat: fromLat, lng: fromLng } as Place) &&
      valid({ lat: toLat, lng: toLng } as Place)
    ) {
      lineRef.current = L.polyline(
        [
          [fromLat, fromLng],
          [toLat, toLng],
        ],
        { color: TO_COLOR, weight: 2, opacity: 0.7 },
      ).addTo(map);
    }

    const fitKey = [fromLat, fromLng, toLat, toLng, single].join(",");
    if (fitKey !== lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
      if (pts.length === 1) {
        map.setView(pts[0], Math.max(map.getZoom(), 10));
      } else if (pts.length >= 2) {
        map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15 });
      }
    }
  }, [fromLat, fromLng, toLat, toLng, single]);

  function pickTarget(which: "from" | "to") {
    setTarget(which);
    targetRef.current = which;
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  function runSearch(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setHits([]);
      setOpen(false);
      return;
    }
    const seq = ++seqRef.current;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/places/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: value }),
        });
        const data = await res.json();
        if (seqRef.current !== seq) return;
        if (!res.ok || !data.ok) {
          setHits([]);
          setOpen(false);
          return;
        }
        setHits(data.places);
        setOpen(data.places.length > 0);
      } catch {
        if (seqRef.current !== seq) return;
        setHits([]);
        setOpen(false);
      }
    }, 400);
  }

  function selectHit(hit: Hit) {
    onPlaceRef.current(target, {
      name: hit.name,
      lat: hit.lat,
      lng: hit.lng,
    });
    setQuery(hit.name);
    setHits([]);
    setOpen(false);
  }

  const showDrop = open && hits.length > 0;
  const nameFieldCls = fieldCls + " w-full pr-7";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {single ? (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Place · acclimatization</label>
            <input
              className={nameFieldCls}
              placeholder="Search or type a place…"
              value={from.name}
              onChange={(e) => onPlace("from", { name: e.target.value })}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>
                From · 1
                <span className="ml-1 text-mist/70">(start)</span>
              </label>
              <input
                className={nameFieldCls}
                placeholder="Search or type a place…"
                value={from.name}
                onChange={(e) => onPlace("from", { name: e.target.value })}
                onFocus={() => pickTarget("from")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>
                To · 2
                <span className="ml-1 text-mist/70">(destination)</span>
              </label>
              <input
                className={nameFieldCls}
                placeholder="Search or type a place…"
                value={to.name}
                onChange={(e) => onPlace("to", { name: e.target.value })}
                onFocus={() => pickTarget("to")}
              />
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-1.5 sm:right-auto sm:w-72">
          {!single && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => pickTarget("from")}
                className={
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium " +
                  (target === "from"
                    ? "border-saffron bg-saffron/15 text-saffron"
                    : "border-line bg-night/80 text-mist hover:text-snow")
                }
              >
                Set 1 · from
              </button>
              <button
                type="button"
                onClick={() => pickTarget("to")}
                className={
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium " +
                  (target === "to"
                    ? "border-saffron bg-saffron/15 text-saffron"
                    : "border-line bg-night/80 text-mist hover:text-snow")
                }
              >
                Set 2 · to
              </button>
            </div>
          )}
          <input
            className={fieldCls + " w-full shadow-lg"}
            placeholder={
              single
                ? "Search a place…"
                : `Search to set ${target === "from" ? "place 1 (from)" : "place 2 (to)"}…`
            }
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            onFocus={() => hits.length > 0 && setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && showDrop) selectHit(hits[0]);
            }}
          />
          {showDrop && (
            <ul
              className="max-h-48 overflow-auto rounded-lg border border-line-strong bg-night shadow-xl"
              onMouseDown={(e) => e.preventDefault()}
            >
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectHit(h)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-snow hover:bg-saffron/10"
                  >
                    <span>{h.name}</span>
                    {h.address && (
                      <span className="text-xs text-mist">{h.address}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div ref={containerRef} className="h-56 w-full rounded-lg border border-line" />
      </div>

      <p className="text-[10px] uppercase tracking-[0.18em] text-mist">
        {single
          ? "Acclimatization day — one place only. Search to mark it."
          : "1 = from, 2 = to. Search to place, drag markers, or click the map."}
      </p>
    </div>
  );
}
