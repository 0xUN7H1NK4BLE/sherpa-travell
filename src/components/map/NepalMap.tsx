"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Trek } from "@/data/treks";
import { formatAltitude } from "@/lib/utils";

export interface NepalMapProps {
  treks: Trek[];
  activeSlug?: string | null;
  onSelect?: (slug: string) => void;
}

function markerIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<span class="map-marker${active ? " map-marker-active" : ""}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FlyTo({ trek }: { trek: Trek | null }) {
  const map = useMap();
  useEffect(() => {
    if (trek) {
      map.flyTo(trek.coordinates, 8, { duration: 1.1 });
    }
  }, [trek, map]);
  return null;
}

export default function NepalMap({
  treks,
  activeSlug = null,
  onSelect,
}: NepalMapProps) {
  const activeTrek = treks.find((t) => t.slug === activeSlug) ?? null;

  return (
    <MapContainer
      center={[28.35, 84.1]}
      zoom={7}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl"
    >
      <TileLayer
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        attribution="Map data &copy; OpenStreetMap contributors, SRTM | Style: OpenTopoMap (CC-BY-SA)"
        maxZoom={17}
      />
      <FlyTo trek={activeTrek} />
      {treks.map((trek) => (
        <Marker
          key={trek.slug}
          position={trek.coordinates}
          icon={markerIcon(trek.slug === activeSlug)}
          eventHandlers={{ click: () => onSelect?.(trek.slug) }}
        >
          <Popup>
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-saffron">
                {trek.region}
              </p>
              <p className="font-display text-lg leading-tight text-snow">
                {trek.name}
              </p>
              <p className="text-xs text-mist">
                {trek.durationDays} days · {formatAltitude(trek.maxAltitudeM)} ·{" "}
                {trek.difficulty}
              </p>
              <a
                href={`/treks/${trek.slug}`}
                className="inline-block pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-saffron underline underline-offset-4"
              >
                Explore this trek →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
