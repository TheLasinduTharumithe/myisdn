"use client";

import dynamic from "next/dynamic";
import { LoaderCircle, MapPinned, Route } from "lucide-react";
import { GeoPointLike, OsrmRouteResult } from "@/types";

const DeliveryTrackingMapCanvas = dynamic(() => import("@/components/DeliveryTrackingMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500">
      <LoaderCircle size={20} className="animate-spin" />
    </div>
  ),
});

interface DeliveryTrackingMapProps {
  customerLocation?: GeoPointLike;
  currentLocation?: GeoPointLike;
  rdcLocation?: GeoPointLike;
  route?: OsrmRouteResult | null;
  routeLoading?: boolean;
  fallbackMessage?: string;
}

export default function DeliveryTrackingMap({
  customerLocation,
  currentLocation,
  rdcLocation,
  route,
  routeLoading = false,
  fallbackMessage,
}: DeliveryTrackingMapProps) {
  return (
    <section className="surface-card overflow-hidden rounded-[2rem] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-eyebrow">Live Tracking Map</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Delivery route and stop points</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-orange-700 ring-1 ring-orange-200">
            <MapPinned size={14} />
            Customer
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sky-700 ring-1 ring-sky-200">
            <MapPinned size={14} />
            Driver
          </span>
          {rdcLocation ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-teal-700 ring-1 ring-teal-200">
              <MapPinned size={14} />
              RDC
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200">
            <Route size={14} />
            {routeLoading ? "Loading route..." : route ? "OSRM route ready" : "Marker view"}
          </span>
        </div>
      </div>

      <DeliveryTrackingMapCanvas
        customerLocation={customerLocation}
        currentLocation={currentLocation}
        rdcLocation={rdcLocation}
        route={route}
      />

      {fallbackMessage ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          {fallbackMessage}
        </p>
      ) : null}
    </section>
  );
}
