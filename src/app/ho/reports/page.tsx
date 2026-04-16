"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import {
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { exportReportPdf } from "@/lib/pdf";
import { getMonthlySales, getPdfReportData, getRdcPerformance, getReportSummary } from "@/services/report.service";
import { MonthlySalesPoint, RdcPerformancePoint, ReportSummary } from "@/types";

const COLORS = ["#22d3ee", "#0ea5e9", "#38bdf8", "#7dd3fc", "#67e8f9"];

const EMPTY_SUMMARY: ReportSummary = {
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalSales: 0,
  pendingOrders: 0,
  deliveredOrders: 0,
  totalCustomers: 0,
  totalStaff: 0,
  lowStockItems: 0,
  deliveryPerformance: 0,
};

export default function HoReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>(EMPTY_SUMMARY);
  const [sales, setSales] = useState<MonthlySalesPoint[]>([]);
  const [performance, setPerformance] = useState<RdcPerformancePoint[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [nextSummary, nextSales, nextPerformance] = await Promise.all([
          getReportSummary(),
          getMonthlySales(),
          getRdcPerformance(),
        ]);
        setSummary(nextSummary);
        setSales(nextSales);
        setPerformance(nextPerformance);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load report data.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleExportPdf() {
    try {
      setExporting(true);
      setError("");
      const pdfData = await getPdfReportData();
      exportReportPdf(pdfData);
      setMessage("PDF report downloaded successfully.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to export PDF report.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ho"]}>
      <DashboardShell
        title="Reports & Analytics"
        description="Explore sales, regional fulfilment, stock distribution, and performance indicators for management reporting."
        actions={
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={exporting || loading}
            className="btn-primary"
          >
            <Download size={16} />
            {exporting ? "Exporting PDF..." : "Export PDF"}
          </button>
        }
      >
        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}

        <section className="surface-soft flex flex-col gap-4 rounded-[2rem] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-eyebrow">Executive Reporting</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Live charts for sales, RDC share, and KPI review</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This screen is designed for quick screenshots, management briefings, and assignment presentation walkthroughs.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <FileBarChart size={16} className="text-[#f57224]" />
              Total revenue
            </div>
            <p className="mt-1 text-lg font-bold text-[#f57224]">LKR {summary.totalSales.toLocaleString("en-LK")}</p>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="surface-card rounded-[2rem] p-6">
            <p className="page-eyebrow">Trend Analysis</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Sales and orders</h2>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales}>
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#f57224" strokeWidth={3} />
                  <Line type="monotone" dataKey="orders" stroke="#ff8a00" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="surface-card rounded-[2rem] p-6">
            <p className="page-eyebrow">Regional Split</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">RDC order share</h2>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={performance} dataKey="orders" nameKey="rdcId" outerRadius={110} innerRadius={60}>
                    {performance.map((entry, index) => (
                      <Cell key={entry.rdcId} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="surface-card rounded-[2rem] p-6">
          <p className="page-eyebrow">Summary Notes</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Executive KPI snapshot</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Pending orders: <span className="font-semibold text-slate-900">{summary.pendingOrders}</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Delivered orders: <span className="font-semibold text-slate-900">{summary.deliveredOrders}</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Registered customers: <span className="font-semibold text-slate-900">{summary.totalCustomers}</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Staff count: <span className="font-semibold text-slate-900">{summary.totalStaff}</span>
            </div>
          </div>
        </section>
      </DashboardShell>
    </ProtectedRoute>
  );
}
