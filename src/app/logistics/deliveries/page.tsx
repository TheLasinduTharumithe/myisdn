"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getDeliveriesForDriver } from "@/services/delivery.service";
import { getOrders } from "@/services/order.service";
import { Delivery, Order } from "@/types";

interface DeliveryRow {
  delivery: Delivery;
  order: Order | null;
}

export default function LogisticsDeliveriesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DeliveryRow[]>([]);

  useEffect(() => {
    async function loadDeliveries() {
      if (!user) {
        return;
      }

      const [deliveries, orders] = await Promise.all([
        getDeliveriesForDriver(user.id),
        getOrders(),
      ]);

      setRows(
        deliveries.map((delivery) => ({
          delivery,
          order: orders.find((order) => order.id === delivery.orderId) ?? null,
        })),
      );
    }

    void loadDeliveries();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["logistics"]}>
      <DashboardShell title="Assigned Deliveries" description="Open each delivery to update route status, live location, and estimated arrival time.">
        {rows.length === 0 ? (
          <EmptyState title="No deliveries assigned" description="Approved RDC orders will appear here once assigned to this logistics user." />
        ) : (
          <div className="table-shell">
            <div className="space-y-3 p-4 md:hidden">
              {rows.map(({ delivery, order }) => (
                <article key={delivery.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Delivery ID</p>
                      <p className="mt-2 break-all text-sm font-bold text-slate-900">{delivery.id}</p>
                    </div>
                    <StatusBadge label={delivery.status} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order ID</p>
                      <p className="mt-1 break-all text-slate-900">{delivery.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Products</p>
                      <p className="mt-1 text-slate-900">
                        {order?.items?.length
                          ? order.items.map((item) => item.productName ?? item.productId).join(", ")
                          : "Products unavailable"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">ETA</p>
                      <p className="mt-1 text-slate-900">{formatDate(delivery.estimatedDelivery)}</p>
                    </div>
                  </div>

                  <Link href={`/logistics/deliveries/${delivery.id}`} className="btn-primary mt-4 flex w-full justify-center !px-3 !py-2 !text-xs">
                    Update
                  </Link>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Delivery ID</th>
                    <th className="px-5 py-4 font-medium">Order ID</th>
                    <th className="px-5 py-4 font-medium">Products</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">ETA</th>
                    <th className="px-5 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ delivery, order }) => (
                    <tr key={delivery.id} className="border-b border-slate-100 text-slate-700 last:border-transparent">
                      <td className="px-5 py-4 font-semibold text-slate-900">{delivery.id}</td>
                      <td className="px-5 py-4">{delivery.orderId}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {order?.items?.length
                          ? order.items.map((item) => item.productName ?? item.productId).join(", ")
                          : "Products unavailable"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={delivery.status} />
                      </td>
                      <td className="px-5 py-4">{formatDate(delivery.estimatedDelivery)}</td>
                      <td className="px-5 py-4">
                        <Link href={`/logistics/deliveries/${delivery.id}`} className="btn-primary !px-3 !py-2 !text-xs">
                          Update
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
