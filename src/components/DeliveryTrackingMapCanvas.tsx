"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { GeoPointLike, OsrmRouteResult } from "@/types";

interface DeliveryTrackingMapCanvasProps {
  customerLocation?: GeoPointLike;
  currentLocation?: GeoPointLike;
  rdcLocation?: GeoPointLike;
  route?: OsrmRouteResult | null;
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
      map.setView([points[0].lat, points[0].lng], 11);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [40, 40] },
    );
  }, [map, points]);

  return null;
}

export default function DeliveryTrackingMapCanvas({
  customerLocation,
  currentLocation,
  rdcLocation,
  route,
}: DeliveryTrackingMapCanvasProps) {
  const safeCustomerLocation = isValidLocation(customerLocation) ? customerLocation : undefined;
  const safeCurrentLocation = isValidLocation(currentLocation) ? currentLocation : undefined;
  const safeRdcLocation = isValidLocation(rdcLocation) ? rdcLocation : undefined;
  const points = [
    ...(route?.coordinates ?? []),
    ...(safeCustomerLocation ? [safeCustomerLocation] : []),
    ...(safeCurrentLocation ? [safeCurrentLocation] : []),
    ...(safeRdcLocation ? [safeRdcLocation] : []),
  ];

  const center = points[0] ?? { lat: 7.8731, lng: 80.7718 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={8}
      scrollWheelZoom={false}
      className="h-[360px] w-full rounded-[1.5rem]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
          <Popup>RDC origin</Popup>
        </CircleMarker>
      ) : null}

      {safeCurrentLocation ? (
        <CircleMarker
          center={[safeCurrentLocation.lat, safeCurrentLocation.lng]}
          radius={10}
          pathOptions={{ color: "#1d4ed8", fillColor: "#38bdf8", fillOpacity: 0.95 }}
        >
          <Popup>Current delivery location</Popup>
        </CircleMarker>
      ) : null}

      {safeCustomerLocation ? (
        <CircleMarker
          center={[safeCustomerLocation.lat, safeCustomerLocation.lng]}
          radius={10}
          pathOptions={{ color: "#b45309", fillColor: "#fb923c", fillOpacity: 0.95 }}
        >
          <Popup>Customer destination</Popup>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}
