"use client";

import dynamic from "next/dynamic";
import { GeoPointLike } from "@/types";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
});

export default function MapView({
  location,
  label,
}: {
  location: GeoPointLike;
  label: string;
}) {
  return (
    <div className="glass-panel overflow-hidden rounded-3xl p-3">
      <MapCanvas location={location} label={label} />
    </div>
  );
}

