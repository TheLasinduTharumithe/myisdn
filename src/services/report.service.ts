import { readCollection } from "@/lib/local-db";
import { getDeliveries } from "@/services/delivery.service";
import { getInventory, getLowStockInventory } from "@/services/inventory.service";
import { getOrders } from "@/services/order.service";
import { getPayments } from "@/services/payment.service";
import { getAllProducts } from "@/services/product.service";
import { getAllUsers } from "@/services/user.service";
import { MonthlySalesPoint, PdfReportData, RdcPerformancePoint, ReportSummary } from "@/types";

export async function getReportSummary(): Promise<ReportSummary> {
  const [orders, payments, users, products, lowStock, deliveries] = await Promise.all([
    getOrders(),
    getPayments(),
    getAllUsers(),
    getAllProducts(),
    getLowStockInventory(),
    getDeliveries(),
  ]);

  const totalSales = payments
    .filter((payment) => payment.paymentStatus === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;

  return {
    totalUsers: users.length,
    totalProducts: products.length,
    totalOrders,
    totalSales,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    deliveredOrders,
    totalCustomers: users.filter((user) => user.role === "customer").length,
    totalStaff: users.filter((user) => user.role !== "customer").length,
    lowStockItems: lowStock.length,
    deliveryPerformance:
      deliveries.length === 0
        ? 0
        : Math.round(
            (deliveries.filter((delivery) => delivery.status === "delivered").length / deliveries.length) * 100,
          ),
  };
}

export async function getPdfReportData(): Promise<PdfReportData> {
  const [summary, inventory, deliveries] = await Promise.all([
    getReportSummary(),
    getInventory(),
    getDeliveries(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    stockUnits: inventory.reduce((sum, item) => sum + item.quantity, 0),
    pendingDeliveries: deliveries.filter((delivery) =>
      delivery.status === "assigned" || delivery.status === "picked_up"
    ).length,
    activeDeliveries: deliveries.filter((delivery) => delivery.status !== "delivered").length,
  };
}

export async function getMonthlySales(): Promise<MonthlySalesPoint[]> {
  const reports = readCollection<MonthlySalesPoint[]>("reports");
  return reports;
}

export async function getRdcPerformance(): Promise<RdcPerformancePoint[]> {
  const [orders, inventory] = await Promise.all([getOrders(), getInventory()]);
  const rdcs = ["north", "south", "east", "west", "central"] as const;

  return rdcs.map((rdcId) => ({
    rdcId,
    orders: orders.filter((order) => order.rdcId === rdcId).length,
    stock: inventory
      .filter((item) => item.rdcId === rdcId)
      .reduce((sum, item) => sum + item.quantity, 0),
  }));
}
