import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Order } from "@/types";

interface OrderTableProps {
  orders: Order[];
  detailsBasePath?: string;
  trackingBasePath?: string;
  actionRenderer?: (order: Order) => React.ReactNode;
}

export default function OrderTable({
  orders,
  detailsBasePath,
  trackingBasePath,
  actionRenderer,
}: OrderTableProps) {
  return (
    <div className="table-shell">
      <div className="space-y-3 p-4 md:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order ID</p>
                <p className="mt-2 break-all text-sm font-bold text-slate-900">{order.id}</p>
              </div>
              <StatusBadge label={order.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">RDC</p>
                <p className="mt-1 capitalize text-slate-900">{order.rdcId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Date</p>
                <p className="mt-1 text-slate-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Amount</p>
                <p className="mt-1 font-semibold text-[#f57224]">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {detailsBasePath ? (
                <Link
                  href={`${detailsBasePath}/${order.id}`}
                  className="btn-outline w-full justify-center px-3 py-2 text-xs font-semibold sm:w-auto"
                >
                  View
                </Link>
              ) : null}
              {trackingBasePath ? (
                <Link
                  href={`${trackingBasePath}/${order.id}`}
                  className="btn-secondary w-full justify-center px-3 py-2 text-xs font-semibold sm:w-auto"
                >
                  Track
                </Link>
              ) : null}
              {actionRenderer ? actionRenderer(order) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Order ID</th>
              <th className="px-5 py-4 font-medium">RDC</th>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Amount</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="text-slate-700">
                <td className="px-5 py-4 font-semibold text-slate-900">{order.id}</td>
                <td className="px-5 py-4 capitalize">{order.rdcId}</td>
                <td className="px-5 py-4">{formatDate(order.createdAt)}</td>
                <td className="px-5 py-4">
                  <StatusBadge label={order.status} />
                </td>
                <td className="px-5 py-4">{formatCurrency(order.totalAmount)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {detailsBasePath ? (
                      <Link
                        href={`${detailsBasePath}/${order.id}`}
                        className="btn-outline px-3 py-2 text-xs font-semibold"
                      >
                        View
                      </Link>
                    ) : null}
                    {trackingBasePath ? (
                      <Link
                        href={`${trackingBasePath}/${order.id}`}
                        className="btn-secondary px-3 py-2 text-xs font-semibold"
                      >
                        Track
                      </Link>
                    ) : null}
                    {actionRenderer ? actionRenderer(order) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
