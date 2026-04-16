"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { GeoPointLike, OsrmRouteResult } from "@/types";

interface DeliveryLocationPickerCanvasProps {
  selectedLocation?: GeoPointLike;
  rdcLocation?: GeoPointLike;
  route?: OsrmRouteResult | null;
  onChange: (location: GeoPointLike) => void;
}

function isValidLocation(value?: GeoPointLike | null) {
  return Boolean(
    value &&
      Number.isFinite(value.lat) &&
      Number.isFinite(value.lng) &&
      Math.abs(value.lat) <= 90 &&
      Math.abs(value.lng) <= 180,
  );
}

function FitMapToData({ points }: { points: GeoPointLike[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 9);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [40, 40] },
    );
  }, [map, points]);

  return null;
}

function MapClickHandler({ onChange }: { onChange: (location: GeoPointLike) => void }) {
  useMapEvents({
    click(event) {
      onChange({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export default function DeliveryLocationPickerCanvas({
  selectedLocation,
  rdcLocation,
  route,
  onChange,
}: DeliveryLocationPickerCanvasProps) {
  const safeSelectedLocation = isValidLocation(selectedLocation) ? selectedLocation : undefined;
  const safeRdcLocation = isValidLocation(rdcLocation) ? rdcLocation : undefined;
  const points = [
    ...(route?.coordinates ?? []),
    ...(safeSelectedLocation ? [safeSelectedLocation] : []),
    ...(safeRdcLocation ? [safeRdcLocation] : []),
  ];

  const center = safeSelectedLocation ?? safeRdcLocation ?? { lat: 7.8731, lng: 80.7718 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={8}
      scrollWheelZoom={true}
      className="h-[360px] w-full rounded-[1.5rem]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onChange={onChange} />
      <FitMapToData points={points} />

      {route?.coordinates?.length ? (
        <Polyline
          positions={route.coordinates.map((point) => [point.lat, point.lng] as [number, number])}
          pathOptions={{ color: "#f57224", weight: 5, opacity: 0.9 }}
        />
      ) : null}

      {safeRdcLocation ? (
        <CircleMarker
          center={[safeRdcLocation.lat, safeRdcLocation.lng]}
          radius={9}
          pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.92 }}
        >
          <Popup>Fulfilment RDC</Popup>
        </CircleMarker>
      ) : null}

      {safeSelectedLocation ? (
        <CircleMarker
          center={[safeSelectedLocation.lat, safeSelectedLocation.lng]}
          radius={10}
          pathOptions={{ color: "#b45309", fillColor: "#fb923c", fillOpacity: 0.95 }}
        >
          <Popup>Selected delivery location</Popup>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}
