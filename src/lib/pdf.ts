import { jsPDF } from "jspdf";
import { PdfReportData } from "@/types";
import { formatCurrency } from "@/lib/utils";

function addRow(doc: jsPDF, label: string, value: string, top: number) {
  doc.setFont("helvetica", "bold");
  doc.text(label, 20, top);
  doc.setFont("helvetica", "normal");
  doc.text(value, 90, top);
}

export function exportReportPdf(data: PdfReportData) {
  const doc = new jsPDF();

  doc.setFillColor(8, 47, 73);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("IslandLink Sales Distribution Network", 20, 16);
  doc.setFontSize(11);
  doc.text("Head Office Summary Report", 20, 24);

  doc.setTextColor(20, 23, 28);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString("en-LK")}`, 20, 42);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Core KPIs", 20, 56);

  doc.setFontSize(11);
  addRow(doc, "Total Users", String(data.summary.totalUsers), 66);
  addRow(doc, "Total Products", String(data.summary.totalProducts), 74);
  addRow(doc, "Total Orders", String(data.summary.totalOrders), 82);
  addRow(doc, "Total Sales", formatCurrency(data.summary.totalSales), 90);
  addRow(doc, "Pending Orders", String(data.summary.pendingOrders), 98);
  addRow(doc, "Delivered Orders", String(data.summary.deliveredOrders), 106);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Delivery & Stock Summary", 20, 124);

  doc.setFontSize(11);
  addRow(doc, "Low Stock Items", String(data.summary.lowStockItems), 134);
  addRow(doc, "Delivery Performance", `${data.summary.deliveryPerformance}%`, 142);
  addRow(doc, "Pending Deliveries", String(data.pendingDeliveries), 150);
  addRow(doc, "Active Deliveries", String(data.activeDeliveries), 158);
  addRow(doc, "Available Stock Units", String(data.stockUnits), 166);

  doc.setDrawColor(180, 188, 201);
  doc.line(20, 178, 190, 178);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This report was generated directly from Firebase Authentication and Firestore live data.",
    20,
    188,
  );

  doc.save(`isdn-report-${new Date(data.generatedAt).toISOString().slice(0, 10)}.pdf`);
}

