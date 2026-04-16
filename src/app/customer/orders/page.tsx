"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareText, PackageCheck, ShoppingBag } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import OrderTable from "@/components/OrderTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import {
  cancelOrder,
  canCustomerCancelOrder,
  getOrderCancellationMessage,
  getOrdersByCustomer,
} from "@/services/order.service";
import { Order } from "@/types";

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  async function refreshOrders() {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      setOrders(await getOrdersByCustomer(user.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }

      await refreshOrders();
    }

    void loadOrders();
  }, [user]);

  const deliveredItems = orders
    .filter((order) => order.status === "delivered")
    .flatMap((order) =>
      order.items.map((item) => ({
        orderId: order.id,
        deliveredAt: order.updatedAt ?? order.createdAt,
        productId: item.productId,
        productName: item.productName ?? item.productId,
        image64: item.image64,
      })),
    );

  async function handleConfirmCancellation() {
    if (!selectedOrder || !user) {
      return;
    }

    try {
      setCancellingId(selectedOrder.id);
      setError("");
      setMessage("");
      await cancelOrder(selectedOrder.id, user.id, cancelReason);
      setMessage(`Order ${selectedOrder.id} was cancelled successfully.`);
      setSelectedOrder(null);
      setCancelReason("");
      await refreshOrders();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel order.");
    } finally {
      setCancellingId("");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell title="Order History" description="Monitor the full order lifecycle from placement to final delivery.">
        <section className="hero-banner flex flex-col gap-5 rounded-[2rem] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">Order Centre</p>
            <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">Review every purchase, invoice, and delivery update in one place.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/88">
              Your order timeline stays synced with RDC processing, logistics handoff, and payment progress.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/14 p-5 text-white backdrop-blur">
              <div className="inline-flex rounded-2xl bg-white/20 p-3">
                <PackageCheck size={20} />
              </div>
              <p className="mt-4 text-sm text-white/80">Total Orders</p>
              <p className="mt-2 text-3xl font-extrabold">{orders.length}</p>
            </div>
            <Link
              href="/customer/products"
              className="flex flex-col justify-between rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur transition hover:bg-white/14"
            >
              <div className="inline-flex rounded-2xl bg-white/20 p-3">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="mt-4 text-sm text-white/80">Need more stock?</p>
                <p className="mt-2 text-lg font-bold">Continue shopping</p>
              </div>
            </Link>
          </div>
        </section>

        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}

        {loading ? (
          <LoadingState label="Loading your orders..." />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your orders will appear here after you complete checkout." />
        ) : (
          <>
            <OrderTable
              orders={orders}
              detailsBasePath="/customer/orders"
              trackingBasePath="/customer/tracking"
              actionRenderer={(order) => {
                const canCancel = canCustomerCancelOrder(order, user?.id);
                const cancellationMessage = getOrderCancellationMessage(order, user?.id);
                const isCancelling = cancellingId === order.id;

                return (
                  <>
                    <button
                      type="button"
                      disabled={!canCancel || isCancelling}
                      title={canCancel ? "Cancel this order" : cancellationMessage}
                      onClick={() => {
                        setSelectedOrder(order);
                        setCancelReason("");
                      }}
                      className="btn-danger w-full justify-center px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Order"}
                    </button>
                    {!canCancel ? (
                      <p className="w-full text-xs text-rose-600">{cancellationMessage}</p>
                    ) : null}
                  </>
                );
              }}
            />

            {deliveredItems.length > 0 ? (
              <section className="surface-card rounded-[2rem] p-5 sm:p-6">
                <p className="page-eyebrow">Review Delivered Products</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Rate items you already received</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Open the product review panel directly from your delivered order history.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {deliveredItems.map((item) => (
                    <article key={`${item.orderId}_${item.productId}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.image64 || "https://placehold.co/160x160/f3f4f6/9ca3af?text=Item"}
                          alt={item.productName}
                          className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{item.productName}</p>
                          <p className="mt-1 text-xs text-slate-500">Order: {item.orderId}</p>
                          <p className="mt-1 text-xs text-slate-500">Delivered: {new Date(item.deliveredAt).toLocaleDateString("en-LK")}</p>
                        </div>
                      </div>

                      <Link
                        href={`/customer/products?reviewProduct=${encodeURIComponent(item.productId)}`}
                        className="btn-outline mt-4 flex w-full justify-center"
                      >
                        <MessageSquareText size={16} />
                        Rate Product
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <ConfirmDialog
          open={Boolean(selectedOrder)}
          title="Are you sure you want to cancel this order?"
          description="You can cancel only early-stage orders. This action will update the order immediately and cannot be undone from the customer side."
          confirmLabel="Yes, Cancel Order"
          cancelLabel="Keep Order"
          confirming={Boolean(selectedOrder) && cancellingId === selectedOrder?.id}
          onConfirm={() => void handleConfirmCancellation()}
          onCancel={() => {
            if (cancellingId) {
              return;
            }

            setSelectedOrder(null);
            setCancelReason("");
          }}
        >
          {selectedOrder ? (
            <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/70 p-4">
              <p className="text-sm font-semibold text-slate-900">Order ID</p>
              <p className="mt-1 break-all text-sm text-slate-600">{selectedOrder.id}</p>

              <label className="mt-4 block">
                <span className="field-label">Reason for cancellation (optional)</span>
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  className="input-field min-h-[6rem] w-full resize-none"
                  placeholder="Add a short reason if needed"
                  maxLength={240}
                />
              </label>
            </div>
          ) : null}
        </ConfirmDialog>
      </DashboardShell>
    </ProtectedRoute>
  );
}
