"use client";

import dynamic from "next/dynamic";
import { LoaderCircle, MapPinned, Navigation, Route } from "lucide-react";
import { GeoPointLike, OsrmRouteResult } from "@/types";

const DeliveryLocationPickerCanvas = dynamic(
  () => import("@/components/DeliveryLocationPickerCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500">
        <LoaderCircle size={20} className="animate-spin" />
      </div>
    ),
  },
);

interface DeliveryLocationPickerProps {
  selectedLocation?: GeoPointLike;
  rdcLocation?: GeoPointLike;
  route?: OsrmRouteResult | null;
  routeLoading?: boolean;
  routeMessage?: string;
  onChange: (location: GeoPointLike) => void;
}

export default function DeliveryLocationPicker({
  selectedLocation,
  rdcLocation,
  route,
  routeLoading = false,
  routeMessage = "",
  onChange,
}: DeliveryLocationPickerProps) {
  return (
    <section className="surface-soft overflow-hidden rounded-[2rem] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-eyebrow">Delivery Map</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Pick the exact drop-off point</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Click anywhere on the map to place the delivery pin. You can refine the location as many times as you need.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {rdcLocation ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-teal-700 ring-1 ring-teal-200">
              <Navigation size={14} />
              RDC origin
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-orange-700 ring-1 ring-orange-200">
            <MapPinned size={14} />
            Delivery pin
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200">
            <Route size={14} />
            {routeLoading ? "Loading route..." : route ? "OSRM preview ready" : "Waiting for pin"}
          </span>
        </div>
      </div>

      <DeliveryLocationPickerCanvas
        selectedLocation={selectedLocation}
        rdcLocation={rdcLocation}
        route={route}
        onChange={onChange}
      />

      {routeMessage ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          {routeMessage}
        </p>
      ) : null}
    </section>
  );
}
