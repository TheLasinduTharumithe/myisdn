"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import OrderTable from "@/components/OrderTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { approveOrder, getOrdersByRdc, updateOrderStatus } from "@/services/order.service";
import { Order } from "@/types";

export default function RdcOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    if (!user?.rdcId) {
      return;
    }
    setOrders(await getOrdersByRdc(user.rdcId));
  }

  useEffect(() => {
    void refresh();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["rdc"]}>
      <DashboardShell title="RDC Order Processing" description="Approve incoming customer orders, move them into processing, and trigger delivery allocation.">
        <section className="surface-soft rounded-[2rem] p-6">
          <p className="page-eyebrow">Order Queue</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Approve and advance orders without leaving the queue</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Pending orders reduce stock on approval, while approved orders can be pushed straight into processing for delivery assignment.
          </p>
        </section>
        {message ? <p className="notice-info">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}
        <OrderTable
          orders={orders}
          actionRenderer={(order) => (
            <>
              {order.status === "pending" ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setMessage("");
                      setError("");
                      await approveOrder(order.id);
                      await refresh();
                      setMessage(`Order ${order.id} approved and inventory updated.`);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unable to approve order.");
                    }
                  }}
                  className="btn-primary !px-3 !py-2 !text-xs"
                >
                  Approve
                </button>
              ) : null}
              {order.status === "approved" ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setMessage("");
                      setError("");
                      await updateOrderStatus(order.id, "processing");
                      await refresh();
                      setMessage(`Order ${order.id} moved to processing.`);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unable to update order status.");
                    }
                  }}
                  className="btn-outline !px-3 !py-2 !text-xs"
                >
                  Process
                </button>
              ) : null}
            </>
          )}
        />
      </DashboardShell>
    </ProtectedRoute>
  );
}
