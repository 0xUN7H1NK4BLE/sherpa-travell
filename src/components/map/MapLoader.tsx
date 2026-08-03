"use client";

import dynamic from "next/dynamic";
import type { NepalMapProps } from "./NepalMap";

const NepalMap = dynamic(() => import("./NepalMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton" />,
});

export default function MapLoader(props: NepalMapProps) {
  return (
    <div className="h-full w-full">
      <NepalMap {...props} />
    </div>
  );
}
