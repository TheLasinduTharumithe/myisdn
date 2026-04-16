"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreditCard, MapPinned, PackageSearch } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderById } from "@/services/order.service";
import { getPaymentByOrder } from "@/services/payment.service";
import { Order, Payment } from "@/types";

export default function CustomerOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const nextOrder = await getOrderById(params.id);
      setOrder(nextOrder);
      if (nextOrder) {
        setPayment(await getPaymentByOrder(nextOrder.id));
      }
      setIsLoading(false);
    }

    void loadData();
  }, [params.id]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <DashboardShell title="Order Details">
          <LoadingState label="Loading order details..." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute allowedRoles={["customer"]}>
        <DashboardShell title="Order Details">
          <EmptyState title="Order not found" description="The requested order could not be found in the current data set." />
        </DashboardShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell title={`Order ${order.id}`} description="Complete order breakdown including billing, items, and fulfilment status.">
        <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
          <section className="surface-card rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="page-eyebrow">Order Breakdown</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Items in this order</h2>
              </div>
              <StatusBadge label={order.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{formatDate(order.createdAt)}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{order.items.length} items</span>
            </div>

            <div className="mt-6 space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image64 || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80"}
                        alt={item.productName ?? "Product"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-slate-500">SKU: {item.productId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                    <p className="mt-1 text-base font-bold text-[#f57224]">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="surface-card rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="page-eyebrow">Billing</p>
                  <h2 className="text-xl font-bold text-slate-900">Payment summary</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-base font-bold text-[#f57224]">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Method</span>
                  <span className="capitalize font-medium text-slate-900">{payment?.method.replaceAll("_", " ") ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Status</span>
                  <StatusBadge label={payment?.paymentStatus ?? "pending"} />
                </div>
              </div>
            </div>

            <div className="surface-card rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
                  <MapPinned size={20} />
                </div>
                <div>
                  <p className="page-eyebrow">Delivery</p>
                  <h2 className="text-xl font-bold text-slate-900">Address and tracking</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{order.deliveryAddress}</p>
              <Link
                href={`/customer/tracking/${order.id}`}
                className="btn-primary mt-6 inline-flex"
              >
                <PackageSearch size={16} />
                Track Delivery
              </Link>
            </div>
          </aside>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
