"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, ClipboardCheck, Route, TriangleAlert } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/lib/auth";
import { getLowStockInventory, getTransfers } from "@/services/inventory.service";
import { getOrdersByRdc } from "@/services/order.service";
import { Order, StockTransfer } from "@/types";

export default function RdcDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!user?.rdcId) {
        return;
      }

      const [rdcOrders, allTransfers, lowStock] = await Promise.all([
        getOrdersByRdc(user.rdcId),
        getTransfers(),
        getLowStockInventory(),
      ]);
      setOrders(rdcOrders);
      setTransfers(allTransfers.filter((transfer) => transfer.fromRdcId === user.rdcId || transfer.toRdcId === user.rdcId));
      setLowStockCount(lowStock.filter((item) => item.rdcId === user.rdcId).length);
    }

    void loadData();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["rdc"]}>
      <DashboardShell title="RDC Dashboard" description="Monitor regional orders, manage stock accuracy, and coordinate inter-RDC transfers.">
        <section className="admin-hero flex flex-col gap-5 rounded-[2rem] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-eyebrow">Regional Control</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Keep your RDC moving with fast approval and clean stock visibility.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Review pending orders, catch low stock early, and transfer items across the network when demand shifts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/rdc/orders" className="btn-primary">
              Review Orders
            </Link>
            <Link href="/rdc/inventory" className="btn-outline">
              Open Inventory
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Incoming Orders" value={String(orders.length)} hint="Orders assigned to this RDC" icon={<ClipboardCheck size={20} />} />
          <StatCard label="Pending Approval" value={String(orders.filter((order) => order.status === "pending").length)} hint="Awaiting RDC action" icon={<Boxes size={20} />} />
          <StatCard label="Low Stock Alerts" value={String(lowStockCount)} hint="Items needing replenishment" icon={<TriangleAlert size={20} />} />
          <StatCard label="Transfers Completed" value={String(transfers.length)} hint="Cross-centre stock movements" icon={<Route size={20} />} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="page-eyebrow">Processing Snapshot</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Regional fulfilment overview</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="subtle-panel">
                <p className="text-sm text-slate-500">Approved</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{orders.filter((order) => order.status === "approved").length}</p>
              </div>
              <div className="subtle-panel">
                <p className="text-sm text-slate-500">Processing</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{orders.filter((order) => order.status === "processing").length}</p>
              </div>
              <div className="subtle-panel">
                <p className="text-sm text-slate-500">Out for delivery</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{orders.filter((order) => order.status === "out_for_delivery").length}</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="page-eyebrow">Quick Actions</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Common RDC tasks</h3>
            <div className="mt-5 space-y-3">
              <Link href="/rdc/orders" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]">
                Approve pending orders
                <ArrowRight size={16} />
              </Link>
              <Link href="/rdc/transfers" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]">
                Create stock transfer
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
