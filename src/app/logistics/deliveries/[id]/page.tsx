"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock3, MapPinned, Navigation, Route, Truck } from "lucide-react";
import DeliveryTrackingMap from "@/components/DeliveryTrackingMap";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { formatRouteDistance, formatRouteDuration, getOsrmRoute, getRdcRouteLocation } from "@/lib/osrm";
import { formatDate, getStatusTone } from "@/lib/utils";
import { getDeliveryById, updateDeliveryStatus } from "@/services/delivery.service";
import { getOrderById, updateOrderStatus } from "@/services/order.service";
import { Delivery, DeliveryStatus, Order, OsrmRouteResult } from "@/types";

export default function LogisticsDeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<DeliveryStatus>("assigned");
  const [lat, setLat] = useState("6.9271");
  const [lng, setLng] = useState("79.8612");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [startingRoute, setStartingRoute] = useState(false);
  const [route, setRoute] = useState<OsrmRouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");

  useEffect(() => {
    async function loadDelivery() {
      const nextDelivery = await getDeliveryById(params.id);
      if (!nextDelivery) {
        setIsLoading(false);
        return;
      }
      const nextOrder = await getOrderById(nextDelivery.orderId);
      setDelivery(nextDelivery);
      setOrder(nextOrder);
      setStatus(nextDelivery.status);
      setLat(String(nextDelivery.currentLocation?.lat ?? 6.9271));
      setLng(String(nextDelivery.currentLocation?.lng ?? 79.8612));
      setIsLoading(false);
    }

    void loadDelivery();
  }, [params.id]);

  useEffect(() => {
    let active = true;

    async function loadRoute() {
      if (!delivery) {
        setRoute(null);
        setRouteMessage("");
        setRouteLoading(false);
        return;
      }

      const customerLocation = order?.deliveryLocation ?? delivery.customerLocation;
      if (!customerLocation) {
        setRoute(null);
        setRouteMessage("Customer delivery coordinates are not available for this delivery.");
        setRouteLoading(false);
        return;
      }

      setRouteLoading(true);
      const nextRoute = await getOsrmRoute(delivery.currentLocation, customerLocation);

      if (!active) {
        return;
      }

      setRoute(nextRoute);
      setRouteMessage(nextRoute ? "" : "Live route unavailable right now. Showing current markers only.");
      setRouteLoading(false);
    }

    void loadRoute();

    return () => {
      active = false;
    };
  }, [delivery, order]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["logistics"]}>
        <DashboardShell title="Delivery Update">
          <LoadingState label="Loading delivery record..." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!delivery) {
    return (
      <ProtectedRoute allowedRoles={["logistics"]}>
        <DashboardShell title="Delivery Update">
          <EmptyState title="Delivery not found" description="The requested delivery record could not be found." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  const currentDelivery = delivery;
  const customerLocation = order?.deliveryLocation ?? currentDelivery.customerLocation;
  const rdcLocation = order ? getRdcRouteLocation(order.rdcId) : undefined;

  function getDirectionsUrl() {
    if (!customerLocation) {
      return "";
    }

    const originLat = Number(lat);
    const originLng = Number(lng);
    const destination = `${customerLocation.lat},${customerLocation.lng}`;
    const origin = Number.isFinite(originLat) && Number.isFinite(originLng)
      ? `${originLat},${originLng}`
      : undefined;

    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", destination);
    url.searchParams.set("travelmode", "driving");

    if (origin) {
      url.searchParams.set("origin", origin);
    }

    return url.toString();
  }

  async function handleStartRoute() {
    if (!customerLocation) {
      setError("Customer location is unavailable, so directions cannot be started yet.");
      return;
    }

    try {
      setStartingRoute(true);
      setError("");

      const nextStatus: DeliveryStatus =
        currentDelivery.status === "assigned"
          ? "picked_up"
          : currentDelivery.status === "picked_up"
            ? "in_transit"
            : currentDelivery.status === "delivered"
              ? "delivered"
              : "in_transit";

      if (nextStatus !== currentDelivery.status) {
        const updatedDelivery = await updateDeliveryStatus(
          currentDelivery.id,
          nextStatus,
          { lat: Number(lat), lng: Number(lng) },
          currentDelivery.estimatedDelivery,
        );
        setDelivery(updatedDelivery);

        const orderStatusMap: Record<DeliveryStatus, "approved" | "out_for_delivery" | "delivered"> = {
          assigned: "approved",
          picked_up: "out_for_delivery",
          in_transit: "out_for_delivery",
          nearby: "out_for_delivery",
          delivered: "delivered",
          delayed: "out_for_delivery",
        };
        await updateOrderStatus(currentDelivery.orderId, orderStatusMap[nextStatus]);
        setStatus(nextStatus);
      }

      const directionsUrl = getDirectionsUrl();
      if (directionsUrl) {
        window.open(directionsUrl, "_blank", "noopener,noreferrer");
      }

      setMessage("Route started. Directions opened for the customer destination.");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start route.");
    } finally {
      setStartingRoute(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError("");
      const updated = await updateDeliveryStatus(
        currentDelivery.id,
        status,
        { lat: Number(lat), lng: Number(lng) },
        currentDelivery.estimatedDelivery,
      );
      setDelivery(updated);
      setMessage("Delivery status updated successfully.");

      const orderStatusMap: Record<DeliveryStatus, "approved" | "out_for_delivery" | "delivered"> = {
        assigned: "approved",
        picked_up: "out_for_delivery",
        in_transit: "out_for_delivery",
        nearby: "out_for_delivery",
        delivered: "delivered",
        delayed: "out_for_delivery",
      };
      await updateOrderStatus(currentDelivery.orderId, orderStatusMap[status]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update delivery.");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["logistics"]}>
      <DashboardShell
        title={`Delivery ${currentDelivery.id}`}
        description="Update live route details and keep the linked customer order in sync with delivery progress."
        navbarSticky={false}
      >
        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <DeliveryTrackingMap
              customerLocation={customerLocation}
              currentLocation={currentDelivery.currentLocation}
              rdcLocation={rdcLocation}
              route={route}
              routeLoading={routeLoading}
              fallbackMessage={routeMessage}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Distance</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {routeLoading ? "Calculating..." : formatRouteDistance(route?.distanceMeters)}
                  </p>
                </div>
              </div>

              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Estimated duration</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {routeLoading ? "Calculating..." : formatRouteDuration(route?.durationSeconds)}
                  </p>
                </div>
              </div>

              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Customer location</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {customerLocation
                      ? `${customerLocation.lat.toFixed(4)}, ${customerLocation.lng.toFixed(4)}`
                      : "Unavailable"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="surface-card space-y-5 rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="page-eyebrow">Delivery Update</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Route status and live coordinates</h2>
              </div>
              <StatusBadge label={currentDelivery.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Customer address</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{currentDelivery.customerAddress || "Not available"}</p>
                </div>
              </div>
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Estimated delivery</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(currentDelivery.estimatedDelivery)}</p>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="field-label">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as DeliveryStatus)} className="select-field w-full">
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="nearby">Nearby</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="field-label">Latitude</span>
                <input type="number" step="0.0001" value={lat} onChange={(event) => setLat(event.target.value)} className="input-field w-full" />
              </label>
              <label className="block">
                <span className="field-label">Longitude</span>
                <input type="number" step="0.0001" value={lng} onChange={(event) => setLng(event.target.value)} className="input-field w-full" />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Truck size={16} className="text-[#f57224]" />
                Linked order
              </div>
              <p className="mt-2">Any status update here will also update the related order tracking flow for the customer.</p>
              {order ? (
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-900">Order ID:</span> <span className="break-all">{order.id}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">RDC:</span> {order.rdcId.toUpperCase()}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleStartRoute()}
                disabled={startingRoute || !customerLocation}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                <Navigation size={16} />
                {startingRoute ? "Starting Route..." : "Start Route"}
              </button>
              <a
                href={getDirectionsUrl() || "#"}
                target="_blank"
                rel="noreferrer"
                className={`btn-outline w-full justify-center ${customerLocation ? "" : "pointer-events-none opacity-60"}`}
              >
                <Route size={16} />
                Open Directions
              </a>
            </div>

            {message ? <p className={`rounded-2xl px-4 py-3 text-sm ${getStatusTone("approved")}`}>{message}</p> : null}
            {error ? <p className="notice-error">{error}</p> : null}

            <button type="submit" className="btn-primary w-full justify-center">
              Save Delivery Update
            </button>
          </form>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
