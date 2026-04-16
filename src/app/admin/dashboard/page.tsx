"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, Shield, Users, Wallet } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils";
import { getProducts } from "@/services/product.service";
import { getReportSummary } from "@/services/report.service";
import { getAllUsers } from "@/services/user.service";

export default function AdminDashboardPage() {
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
  const [usersCount, setUsersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      const [nextSummary, users, products] = await Promise.all([
        getReportSummary(),
        getAllUsers(),
        getProducts({ showInactive: true }),
      ]);
      setSummary(nextSummary);
      setUsersCount(users.length);
      setProductsCount(products.length);
    }

    void loadData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardShell title="Admin Dashboard" description="Maintain users, products, and overall system control for the ISDN web platform.">
        <section className="admin-hero flex flex-col gap-5 rounded-[2rem] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-eyebrow">Platform Control</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Run user access and catalog management from one clean workspace.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              The admin area now feels like a polished operations portal while keeping the existing Firebase-backed workflows intact.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users" className="btn-primary">
              Manage Users
            </Link>
            <Link href="/admin/products" className="btn-outline">
              Manage Products
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={String(usersCount)} hint="All registered accounts" icon={<Users size={20} />} />
          <StatCard label="Products" value={String(productsCount)} hint="Catalog records" icon={<Boxes size={20} />} />
          <StatCard label="Paid Sales" value={formatCurrency(summary.totalSales)} hint="Current processed payments" icon={<Wallet size={20} />} />
          <StatCard label="Security Scope" value="RBAC" hint="Role-based access enforcement" icon={<Shield size={20} />} />
        </section>

        <section className="surface-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="page-eyebrow">Quick Actions</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Administrative shortcuts</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link href="/admin/orders" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]">
              Track and manage orders
              <ArrowRight size={16} />
            </Link>
            <Link href="/admin/users" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]">
              Review user roles
              <ArrowRight size={16} />
            </Link>
            <Link href="/admin/products" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]">
              Update product catalog
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
