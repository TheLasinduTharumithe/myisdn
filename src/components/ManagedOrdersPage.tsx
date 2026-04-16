"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import OrderTable from "@/components/OrderTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import { manageOrderStatus, getOrders } from "@/services/order.service";
import { Order, OrderStatus, UserRole } from "@/types";

const ORDER_STATUSES: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

interface ManagedOrdersPageProps {
  allowedRoles: UserRole[];
  title: string;
  description: string;
  detailsBasePath: string;
}

export default function ManagedOrdersPage({
  allowedRoles,
  title,
  description,
  detailsBasePath,
}: ManagedOrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      setOrders(await getOrders());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = `${order.id} ${order.customerName ?? ""} ${order.customerId} ${order.deliveryAddress} ${order.rdcId}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [orders, search, statusFilter],
  );

  async function handleQuickStatus(order: Order, nextStatus: OrderStatus) {
    try {
      setUpdatingId(order.id);
      setError("");
      await manageOrderStatus(order.id, nextStatus);
      setMessage(`Order ${order.id} updated to ${nextStatus.replaceAll("_", " ")}.`);
      await refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update order status.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardShell title={title} description={description}>
        <section className="surface-soft rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="page-eyebrow">Order Oversight</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Track customer orders and manage status changes</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Review island-wide customer orders, open the tracking view, and move orders through approval, delivery, and closure.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              Orders loaded: <span className="font-bold text-slate-900">{orders.length}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by order ID, customer, address, or RDC"
                className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "all")}
              className="select-field"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Statuses" : status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </section>

        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}
        <p className="notice-info">
          Open any order to view delivery tracking details. Quick actions here are intended for common workflow steps.
        </p>

        {loading ? (
          <LoadingState label="Loading customer orders..." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState title="No orders found" description="Try a different search term or status filter." />
        ) : (
          <OrderTable
            orders={filteredOrders}
            detailsBasePath={detailsBasePath}
            actionRenderer={(order) => (
              <>
                {order.status === "pending" ? (
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => void handleQuickStatus(order, "approved")}
                    className="btn-primary !px-3 !py-2 !text-xs disabled:opacity-60"
                  >
                    {updatingId === order.id ? "Saving..." : "Approve"}
                  </button>
                ) : null}
                {order.status === "approved" ? (
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => void handleQuickStatus(order, "processing")}
                    className="btn-outline !px-3 !py-2 !text-xs disabled:opacity-60"
                  >
                    {updatingId === order.id ? "Saving..." : "Process"}
                  </button>
                ) : null}
                {order.status === "processing" ? (
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => void handleQuickStatus(order, "out_for_delivery")}
                    className="btn-secondary !px-3 !py-2 !text-xs disabled:opacity-60"
                  >
                    {updatingId === order.id ? "Saving..." : "Dispatch"}
                  </button>
                ) : null}
                {order.status === "out_for_delivery" ? (
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => void handleQuickStatus(order, "delivered")}
                    className="btn-primary !px-3 !py-2 !text-xs disabled:opacity-60"
                  >
                    {updatingId === order.id ? "Saving..." : "Deliver"}
                  </button>
                ) : null}
              </>
            )}
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
