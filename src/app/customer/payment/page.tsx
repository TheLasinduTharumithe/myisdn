"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, MapPinned, Route, Truck } from "lucide-react";
import DeliveryLocationPicker from "@/components/DeliveryLocationPicker";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { formatRouteDistance, formatRouteDuration, getOsrmRoute, getRdcRouteLocation } from "@/lib/osrm";
import { formatCurrency, getRdcLabel, RDC_OPTIONS } from "@/lib/utils";
import { getCartTotals } from "@/services/cart.service";
import { placeOrder } from "@/services/order.service";
import { CartItem, GeoPointLike, OsrmRouteResult, PaymentMethod, RdcId } from "@/types";

export default function CustomerPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("24 Galle Road, Colombo 03");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [rdcId, setRdcId] = useState<RdcId>("west");
  const [deliveryLocation, setDeliveryLocation] = useState<GeoPointLike | undefined>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [routePreview, setRoutePreview] = useState<OsrmRouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");

  useEffect(() => {
    async function loadCart() {
      const totals = await getCartTotals();
      setItems(totals.items);
      setSubtotal(totals.subtotal);
    }

    void loadCart();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRoutePreview() {
      if (!deliveryLocation) {
        setRoutePreview(null);
        setRouteMessage("Select the delivery point on the map to preview the logistics route.");
        setRouteLoading(false);
        return;
      }

      setRouteLoading(true);
      const nextRoute = await getOsrmRoute(getRdcRouteLocation(rdcId), deliveryLocation);

      if (!active) {
        return;
      }

      setRoutePreview(nextRoute);
      setRouteMessage(
        nextRoute
          ? ""
          : "OSRM route preview is unavailable right now. The saved location will still appear on the logistics map.",
      );
      setRouteLoading(false);
    }

    void loadRoutePreview();

    return () => {
      active = false;
    };
  }, [deliveryLocation, rdcId]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location services are not available in this browser.");
      return;
    }

    setError("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryLocation({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setLocationLoading(false);
      },
      () => {
        setError("Unable to fetch your current location. You can still click on the map to place the delivery pin.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user) {
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Delivery address is required.");
      return;
    }

    if (!deliveryLocation) {
      setError("Select the delivery location on the map before placing the order.");
      return;
    }

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);
      const order = await placeOrder({
        customerId: user.id,
        deliveryAddress,
        deliveryLocation,
        paymentMethod,
        rdcId,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      setMessage("Order placed successfully.");
      router.push(`/customer/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell
        title="Billing & Payment"
        description="Confirm your address, choose a payment method, and create the order invoice."
        navbarSticky={false}
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
          <form onSubmit={handleSubmit} className="surface-card space-y-5 rounded-[1.5rem] p-5 sm:p-6">
            <div>
              <p className="page-eyebrow">Checkout</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Delivery & payment details</h2>
            </div>
            <label className="block">
              <span className="field-label">Delivery Address</span>
              <textarea
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                rows={4}
                className="textarea-field"
              />
            </label>

            <label className="block">
              <span className="field-label">Fulfilment RDC</span>
              <select
                value={rdcId}
                onChange={(event) => setRdcId(event.target.value as RdcId)}
                className="select-field"
              >
                {RDC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="field-label">Payment Method</span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                className="select-field"
              >
                <option value="card">Card Payment</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleUseCurrentLocation()}
                disabled={locationLoading}
                className="btn-outline"
              >
                <Crosshair size={16} />
                {locationLoading ? "Getting location..." : "Use Current Location"}
              </button>
              {deliveryLocation ? (
                <button
                  type="button"
                  onClick={() => setDeliveryLocation(undefined)}
                  className="btn-outline"
                >
                  Clear Pin
                </button>
              ) : null}
            </div>

            <DeliveryLocationPicker
              selectedLocation={deliveryLocation}
              rdcLocation={getRdcRouteLocation(rdcId)}
              route={routePreview}
              routeLoading={routeLoading}
              routeMessage={routeMessage}
              onChange={(location) => {
                setDeliveryLocation(location);
                setError("");
              }}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <MapPinned size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Selected point</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {deliveryLocation
                      ? `${deliveryLocation.lat.toFixed(4)}, ${deliveryLocation.lng.toFixed(4)}`
                      : "Click on the map"}
                  </p>
                </div>
              </div>

              <div className="subtle-panel flex items-start gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Route distance</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {routeLoading ? "Calculating..." : formatRouteDistance(routePreview?.distanceMeters)}
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
                    {routeLoading ? "Calculating..." : formatRouteDuration(routePreview?.durationSeconds)}
                  </p>
                </div>
              </div>
            </div>

            <div className="subtle-panel border border-orange-100 bg-orange-50/60 p-5">
              <p className="text-sm font-semibold text-slate-900">Delivery summary</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{deliveryAddress}</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">Fulfilment RDC</p>
              <p className="mt-1 text-sm text-slate-600">{getRdcLabel(rdcId)}</p>
            </div>

            {error ? <p className="notice-error">{error}</p> : null}
            {message ? <p className="notice-success">{message}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Placing order..." : "Place Order"}
            </button>
          </form>

            <aside className="surface-soft rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Invoice Summary</h2>
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                <div key={item.productId} className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.product.image64 || item.product.imageUrl || "https://placehold.co/160x160/f3f4f6/9ca3af?text=Item"}
                      alt={item.product.name}
                      className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.product.name}</p>
                      <p className="text-slate-500">
                      {item.quantity} x {formatCurrency(item.product.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900 sm:text-right">{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
              </div>
            <div className="mt-6 border-t border-orange-100 pt-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Payment status</span>
                <span>{paymentMethod === "cash_on_delivery" ? "Pending" : "Paid on order"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span>Map location</span>
                <span>{deliveryLocation ? "Selected" : "Required"}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-lg font-extrabold text-slate-900">
                <span>Total</span>
                <span className="text-[#f57224]">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
