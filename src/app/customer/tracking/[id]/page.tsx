"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Clock3, MapPinned, Route, Truck } from "lucide-react";
import DeliveryTrackingMap from "@/components/DeliveryTrackingMap";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { formatRouteDistance, formatRouteDuration, getOsrmRoute, getRdcRouteLocation } from "@/lib/osrm";
import { formatCurrency, formatDate, getRdcLabel } from "@/lib/utils";
import { getDeliveryByOrderId } from "@/services/delivery.service";
import { getOrderById } from "@/services/order.service";
import { Delivery, Order, OsrmRouteResult } from "@/types";

const timeline = ["assigned", "picked_up", "in_transit", "nearby", "delivered"];

export default function CustomerTrackingPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<OsrmRouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");

  useEffect(() => {
    async function loadTracking() {
      const nextOrder = await getOrderById(params.id);
      setOrder(nextOrder);
      if (nextOrder) {
        setDelivery(await getDeliveryByOrderId(nextOrder.id));
      }
      setIsLoading(false);
    }

    void loadTracking();
  }, [params.id]);

  useEffect(() => {
    let active = true;

    async function loadRoute() {
      if (!order || !delivery) {
        setRoute(null);
        setRouteMessage("");
        setRouteLoading(false);
        return;
      }

      const customerLocation = order.deliveryLocation ?? delivery.customerLocation;
      const startLocation = delivery.currentLocation;

      if (!customerLocation) {
        setRoute(null);
        setRouteMessage("Customer delivery location is not available yet.");
        setRouteLoading(false);
        return;
      }

      setRouteLoading(true);
      const nextRoute = await getOsrmRoute(startLocation, customerLocation);

      if (!active) {
        return;
      }

      setRoute(nextRoute);
      setRouteMessage(
        nextRoute ? "" : "Live route unavailable right now. Showing the current delivery markers instead.",
      );
      setRouteLoading(false);
    }

    void loadRoute();

    return () => {
      active = false;
    };
  }, [delivery, order]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <DashboardShell title="Track Delivery">
          <LoadingState label="Loading delivery tracking..." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <DashboardShell title="Track Delivery">
          <EmptyState title="Order not found" description="The selected order could not be found." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!delivery) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <DashboardShell title={`Tracking ${order.id}`}>
          <EmptyState title="Delivery not assigned yet" description="This order is still waiting for RDC approval or logistics assignment." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  const currentIndex = timeline.indexOf(delivery.status);
  const customerLocation = order.deliveryLocation ?? delivery.customerLocation;
  const rdcLocation = getRdcRouteLocation(order.rdcId);

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell
        title={`Tracking ${order.id}`}
        description="View live delivery progress, estimated arrival time, and current route location."
        navbarSticky={false}
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <DeliveryTrackingMap
              customerLocation={customerLocation}
              currentLocation={delivery.currentLocation}
              rdcLocation={rdcLocation}
              route={route}
              routeLoading={routeLoading}
              fallbackMessage={routeMessage}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Estimated arrival</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(delivery.estimatedDelivery)}</p>
                </div>
              </div>

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
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Travel time</p>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">RDC source</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{getRdcLabel(order.rdcId)}</p>
                </div>
              </div>
            </div>
          </div>

          <section className="surface-card rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="page-eyebrow">Delivery Timeline</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Track the latest route progress</h2>
              </div>
              <StatusBadge label={delivery.status} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Delivery address</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{order.deliveryAddress}</p>
                </div>
              </div>
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Order total</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {timeline.map((step, index) => {
                const active = index <= currentIndex;
                return (
                  <div
                    key={step}
                    className={`flex items-start gap-4 rounded-3xl border p-4 transition ${
                      active ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                        active ? "bg-[#f57224] text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <Truck size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${active ? "text-slate-900" : "text-slate-500"}`}>
                        {step.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {active ? "Completed or current stage in the delivery route." : "Upcoming step in the delivery workflow."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order summary</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Items</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{order.items.length} product lines</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last updated</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(delivery.updatedAt)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Customer coordinates</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {customerLocation ? `${customerLocation.lat.toFixed(4)}, ${customerLocation.lng.toFixed(4)}` : "Unavailable"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
