"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock3, MapPinned, PackageSearch, Route, Truck } from "lucide-react";
import DeliveryTrackingMap from "@/components/DeliveryTrackingMap";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { formatRouteDistance, formatRouteDuration, getOsrmRoute, getRdcRouteLocation } from "@/lib/osrm";
import { formatCurrency, formatDate, getRdcLabel } from "@/lib/utils";
import { getDeliveryByOrderId } from "@/services/delivery.service";
import { getOrderById, manageOrderStatus } from "@/services/order.service";
import { getPaymentByOrder } from "@/services/payment.service";
import { Delivery, Order, OrderStatus, OsrmRouteResult, Payment, UserRole } from "@/types";

const MANAGEABLE_STATUSES: OrderStatus[] = [
  "pending",
  "approved",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

interface ManagedOrderDetailPageProps {
  allowedRoles: UserRole[];
  listHref: string;
  titlePrefix: string;
}

export default function ManagedOrderDetailPage({
  allowedRoles,
  listHref,
  titlePrefix,
}: ManagedOrderDetailPageProps) {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [route, setRoute] = useState<OsrmRouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const nextOrder = await getOrderById(params.id);
      setOrder(nextOrder);
      if (!nextOrder) {
        setDelivery(null);
        setPayment(null);
        return;
      }

      const [nextDelivery, nextPayment] = await Promise.all([
        getDeliveryByOrderId(nextOrder.id),
        getPaymentByOrder(nextOrder.id),
      ]);

      setDelivery(nextDelivery);
      setPayment(nextPayment);
      setStatus(nextOrder.status);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load order details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
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
      if (!customerLocation) {
        setRoute(null);
        setRouteMessage("Customer delivery coordinates are not available for this order.");
        setRouteLoading(false);
        return;
      }

      setRouteLoading(true);
      const nextRoute = await getOsrmRoute(delivery.currentLocation, customerLocation);

      if (!active) {
        return;
      }

      setRoute(nextRoute);
      setRouteMessage(nextRoute ? "" : "Live route unavailable right now. Showing markers only.");
      setRouteLoading(false);
    }

    void loadRoute();

    return () => {
      active = false;
    };
  }, [delivery, order]);

  async function handleSaveStatus() {
    if (!order) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await manageOrderStatus(order.id, status);
      setMessage(`Order ${order.id} updated to ${status.replaceAll("_", " ")}.`);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <DashboardShell title={`${titlePrefix} Order`}>
          <LoadingState label="Loading managed order..." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <DashboardShell title={`${titlePrefix} Order`}>
          <EmptyState title="Order not found" description="The requested order could not be found." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  const customerLocation = order.deliveryLocation ?? delivery?.customerLocation;
  const rdcLocation = getRdcRouteLocation(order.rdcId);

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardShell
        title={`${titlePrefix} ${order.id}`}
        description="Track the linked delivery route, inspect customer order details, and manage workflow status changes."
        navbarSticky={false}
        actions={
          <Link href={listHref} className="btn-outline">
            Back to Orders
          </Link>
        }
      >
        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {delivery ? (
              <DeliveryTrackingMap
                customerLocation={customerLocation}
                currentLocation={delivery.currentLocation}
                rdcLocation={rdcLocation}
                route={route}
                routeLoading={routeLoading}
                fallbackMessage={routeMessage}
              />
            ) : (
              <EmptyState
                title="Delivery not assigned yet"
                description="This order does not have a logistics delivery record yet. Approving or dispatching the order will create and sync delivery tracking."
              />
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">ETA</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {delivery ? formatDate(delivery.estimatedDelivery) : "Awaiting assignment"}
                  </p>
                </div>
              </div>

              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Distance</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {delivery ? (routeLoading ? "Calculating..." : formatRouteDistance(route?.distanceMeters)) : "Not available"}
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
                    {delivery ? (routeLoading ? "Calculating..." : formatRouteDuration(route?.durationSeconds)) : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <section className="surface-card rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="page-eyebrow">Order Items</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Customer purchase breakdown</h2>
                </div>
                <StatusBadge label={order.status} />
              </div>

              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image64 || "https://placehold.co/180x180/f3f4f6/9ca3af?text=Item"}
                          alt={item.productName ?? "Product"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.productName ?? item.productId}</p>
                        <p className="text-slate-500">SKU: {item.productId}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-slate-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                      <p className="mt-1 text-base font-bold text-[#f57224]">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="surface-card rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="page-eyebrow">Workflow Control</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Manage customer order status</h2>
                </div>
                <StatusBadge label={order.status} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="subtle-panel flex items-start gap-3">
                  <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                    <PackageSearch size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Order ID</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-900">{order.id}</p>
                  </div>
                </div>
                <div className="subtle-panel flex items-start gap-3">
                  <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                    <MapPinned size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fulfilment RDC</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{getRdcLabel(order.rdcId)}</p>
                  </div>
                </div>
              </div>

              <label className="mt-5 block">
                <span className="field-label">Order Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as OrderStatus)}
                  className="select-field"
                >
                  {MANAGEABLE_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStatus("approved")}
                  className="btn-outline w-full justify-center"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("processing")}
                  className="btn-outline w-full justify-center"
                >
                  Mark Processing
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("out_for_delivery")}
                  className="btn-outline w-full justify-center"
                >
                  Out for Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("delivered")}
                  className="btn-outline w-full justify-center"
                >
                  Mark Delivered
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleSaveStatus()}
                disabled={saving}
                className="btn-primary mt-5 w-full justify-center disabled:opacity-60"
              >
                {saving ? "Saving Order..." : "Save Order Status"}
              </button>
            </section>

            <section className="surface-card rounded-[2rem] p-5 sm:p-6">
              <p className="page-eyebrow">Customer & Billing</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Order summary details</h2>

              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Customer ID</span>
                  <span className="break-all text-right font-medium text-slate-900">{order.customerId}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Order created</span>
                  <span className="text-right font-medium text-slate-900">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Payment status</span>
                  <StatusBadge label={payment?.paymentStatus ?? order.paymentStatus ?? "pending"} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Payment method</span>
                  <span className="text-right font-medium capitalize text-slate-900">
                    {payment?.method?.replaceAll("_", " ") ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-orange-100 pt-4">
                  <span>Total amount</span>
                  <span className="text-base font-bold text-[#f57224]">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Delivery address</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{order.deliveryAddress || "Not available"}</p>
                {customerLocation ? (
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Coordinates: {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
                  </p>
                ) : null}
                {delivery ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Delivery status</span>
                    <StatusBadge label={delivery.status} />
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
