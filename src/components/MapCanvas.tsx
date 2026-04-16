"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { GeoPointLike } from "@/types";

export default function MapCanvas({
  location,
  label,
}: {
  location: GeoPointLike;
  label: string;
}) {
  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={11}
      scrollWheelZoom={false}
      className="h-[320px] w-full rounded-3xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[location.lat, location.lng]}
        radius={10}
        pathOptions={{ color: "#22d3ee", fillColor: "#22d3ee", fillOpacity: 0.9 }}
      >
        <Popup>{label}</Popup>
      </CircleMarker>
    </MapContainer>
  );
}

