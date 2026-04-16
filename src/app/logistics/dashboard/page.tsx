"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, LocateFixed, PackageCheck, Truck } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/lib/auth";
import { getDeliveriesForDriver } from "@/services/delivery.service";
import { Delivery } from "@/types";

export default function LogisticsDashboardPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    async function loadDeliveries() {
      if (!user) {
        return;
      }
      setDeliveries(await getDeliveriesForDriver(user.id));
    }

    void loadDeliveries();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["logistics"]}>
      <DashboardShell title="Logistics Dashboard" description="Track assigned deliveries, update route progress, and keep customers informed with current status changes.">
        <section className="admin-hero flex flex-col gap-5 rounded-[2rem] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-eyebrow">Route Desk</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Stay on top of every assigned route with clearer delivery visibility.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Update live location, move deliveries through the route timeline, and keep customer tracking pages current.
            </p>
          </div>
          <Link href="/logistics/deliveries" className="btn-primary">
            Open Delivery Queue
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned Deliveries" value={String(deliveries.length)} hint="Jobs allocated to this driver" icon={<Truck size={20} />} />
          <StatCard label="In Transit" value={String(deliveries.filter((item) => item.status === "in_transit").length)} hint="Currently on the road" icon={<LocateFixed size={20} />} />
          <StatCard label="Nearby" value={String(deliveries.filter((item) => item.status === "nearby").length)} hint="Approaching final destination" icon={<Clock3 size={20} />} />
          <StatCard label="Delivered" value={String(deliveries.filter((item) => item.status === "delivered").length)} hint="Completed drops" icon={<PackageCheck size={20} />} />
        </section>

        <section className="surface-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="page-eyebrow">Today&apos;s Focus</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Quick delivery actions</h3>
            </div>
            <Truck className="text-[#f57224]" size={22} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link href="/logistics/deliveries" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]">
              Review active deliveries
              <ArrowRight size={16} />
            </Link>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Delivered today: <span className="font-bold text-slate-900">{deliveries.filter((item) => item.status === "delivered").length}</span>
            </div>
          </div>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
