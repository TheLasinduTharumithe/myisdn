"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareText, PackageCheck, ShoppingBag } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import OrderTable from "@/components/OrderTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { getOrdersByCustomer } from "@/services/order.service";
import { Order } from "@/types";

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        return;
      }
      setOrders(await getOrdersByCustomer(user.id));
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

        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your orders will appear here after you complete checkout." />
        ) : (
          <>
            <OrderTable orders={orders} detailsBasePath="/customer/orders" trackingBasePath="/customer/tracking" />

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
      </DashboardShell>
    </ProtectedRoute>
  );
}
