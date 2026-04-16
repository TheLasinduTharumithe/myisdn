"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Boxes, PackageCheck, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils";
import { getMonthlySales, getReportSummary } from "@/services/report.service";
import { MonthlySalesPoint } from "@/types";

export default function HoDashboardPage() {
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalCustomers: 0,
    totalStaff: 0,
    lowStockItems: 0,
    deliveryPerformance: 0,
  });
  const [sales, setSales] = useState<MonthlySalesPoint[]>([]);

  useEffect(() => {
    async function loadData() {
      setSummary(await getReportSummary());
      setSales(await getMonthlySales());
    }

    void loadData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["ho"]}>
      <DashboardShell title="Head Office Dashboard" description="Track island-wide operational KPIs across orders, revenue, stock health, and delivery performance.">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Orders" value={String(summary.totalOrders)} hint="All system orders" icon={<PackageCheck size={20} />} />
          <StatCard label="Total Sales" value={formatCurrency(summary.totalSales)} hint="Paid revenue value" icon={<TrendingUp size={20} />} />
          <StatCard label="Low Stock Items" value={String(summary.lowStockItems)} hint="Needs replenishment attention" icon={<Boxes size={20} />} />
          <StatCard label="Delivery Performance" value={`${summary.deliveryPerformance}%`} hint="Successfully completed deliveries" icon={<BarChart3 size={20} />} />
        </section>

        <section className="surface-card rounded-[2rem] p-6">
          <p className="page-eyebrow">Performance Trend</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Monthly sales overview</h2>
          <p className="mt-2 text-sm text-slate-600">Management overview of order volume and sales growth across recent months.</p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="sales" fill="#f57224" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card rounded-[2rem] p-6">
          <p className="page-eyebrow">Order Control</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Customer order management</h2>
          <p className="mt-2 text-sm text-slate-600">Open the management queue to track deliveries and move customer orders through approval and completion.</p>
          <div className="mt-5">
            <Link href="/ho/orders" className="btn-primary">
              Open Order Control
            </Link>
          </div>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
