"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageCheck, ShoppingCart, Truck, Wallet } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import OrderTable from "@/components/OrderTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getDeliveryByOrderId } from "@/services/delivery.service";
import { getOrdersByCustomer } from "@/services/order.service";
import { getPaymentsByCustomer } from "@/services/payment.service";
import { Order, Payment } from "@/types";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        return;
      }

      const nextOrders = await getOrdersByCustomer(user.id);
      const nextPayments = await getPaymentsByCustomer(user.id);
      const deliveryChecks = await Promise.all(nextOrders.map((order) => getDeliveryByOrderId(order.id)));
      setOrders(nextOrders);
      setPayments(nextPayments);
      setActiveDeliveries(deliveryChecks.filter((delivery) => delivery && delivery.status !== "delivered").length);
    }

    void loadData();
  }, [user]);

  const totalSpend = payments
    .filter((payment) => payment.paymentStatus === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell
        title="Customer Dashboard"
        description="Browse products, monitor active orders, review billing, and track deliveries in real time."
        actions={
          <>
            <Link href="/customer/products" className="btn-primary text-sm">
              Browse Products
            </Link>
            <Link href="/customer/orders" className="btn-outline text-sm">
              View Orders
            </Link>
          </>
        }
      >
        <section className="hero-banner rounded-[1.75rem] p-5 shadow-[0_18px_50px_rgba(245,114,36,0.18)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">Shopping Overview</p>
              <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">Continue ordering with full delivery visibility.</h2>
            </div>
            <Link href="/customer/cart" className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#f57224] sm:w-auto">
              Open Cart
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Orders Placed" value={String(orders.length)} hint="Customer order history" icon={<PackageCheck size={20} />} />
          <StatCard label="Paid Value" value={formatCurrency(totalSpend)} hint="Successful completed payments" icon={<Wallet size={20} />} />
          <StatCard label="Active Deliveries" value={String(activeDeliveries)} hint="Orders on the move" icon={<Truck size={20} />} />
          <StatCard label="Pending Payments" value={String(payments.filter((payment) => payment.paymentStatus === "pending").length)} hint="Awaiting collection" icon={<ShoppingCart size={20} />} />
        </section>

        <section className="space-y-4">
          <div className="surface-card rounded-[1.5rem] p-5">
            <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
            <p className="mt-2 text-sm text-slate-500">A quick view of your latest orders, delivery progress, and totals.</p>
          </div>
          <OrderTable orders={orders.slice(0, 5)} detailsBasePath="/customer/orders" trackingBasePath="/customer/tracking" />
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
