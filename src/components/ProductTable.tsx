"use client";

import { Edit3, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  deletingId?: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductTable({
  products,
  deletingId,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="table-shell self-start">
      <div className="space-y-3 p-4 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    product.image64 ||
                    product.imageUrl ||
                    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80"
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{product.category}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.description}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Price</p>
                <p className="mt-1 font-semibold text-slate-900">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Stock</p>
                <p className="mt-1 text-slate-900">{product.stock}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</p>
                <div className="mt-1">
                  <span
                    className={
                      product.isActive
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                        : "rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200"
                    }
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => onEdit(product)} className="btn-outline w-full justify-center !px-3 !py-2 !text-xs">
                <Edit3 size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                disabled={Boolean(deletingId)}
                className="btn-danger w-full justify-center !px-3 !py-2 !text-xs disabled:opacity-60"
              >
                <Trash2 size={14} />
                {deletingId === product.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Product</th>
              <th className="px-5 py-4 font-medium">Category</th>
              <th className="px-5 py-4 font-medium">Price</th>
              <th className="px-5 py-4 font-medium">Stock</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-100 text-slate-700 last:border-transparent">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          product.image64 ||
                          product.imageUrl ||
                          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="line-clamp-1 max-w-sm text-xs text-slate-500">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">{product.category}</td>
                <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(product.price)}</td>
                <td className="px-5 py-4">{product.stock}</td>
                <td className="px-5 py-4">
                  <span
                    className={
                      product.isActive
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                        : "rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200"
                    }
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => onEdit(product)} className="btn-outline !px-3 !py-2 !text-xs">
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      disabled={Boolean(deletingId)}
                      className="btn-danger !px-3 !py-2 !text-xs disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </button>
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
