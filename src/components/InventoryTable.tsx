"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Inventory, Product } from "@/types";

interface InventoryTableProps {
  inventory: Inventory[];
  products: Product[];
  onSave: (inventoryId: string, quantity: number) => Promise<void>;
}

export default function InventoryTable({ inventory, products, onSave }: InventoryTableProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts((current) =>
      Object.fromEntries(
        inventory.map((item) => [item.id, current[item.id] ?? String(item.quantity ?? 0)]),
      ),
    );
  }, [inventory]);

  return (
    <div className="table-shell">
      <div className="space-y-3 p-4 md:hidden">
        {inventory.map((item) => {
          const product = products.find((productItem) => productItem.id === item.productId);
          const draftValue = drafts[item.id] ?? String(item.quantity ?? 0);

          return (
            <article key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product</p>
                  <p className="mt-2 break-words text-sm font-bold text-slate-900">{product?.name ?? item.productId}</p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold capitalize text-orange-700 ring-1 ring-orange-200">
                  {item.rdcId}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quantity</span>
                  <input
                    type="number"
                    min={0}
                    value={draftValue}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="input-field mt-2 w-full px-3 py-2"
                  />
                </label>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Last Updated</p>
                  <p className="mt-3 text-slate-900">{new Date(item.updatedAt).toLocaleDateString("en-LK")}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={savingId === item.id}
                onClick={async () => {
                  try {
                    setSavingId(item.id);
                    await onSave(item.id, Math.max(0, Number(draftValue || item.quantity || 0)));
                  } finally {
                    setSavingId(null);
                  }
                }}
                className="btn-primary mt-4 w-full justify-center px-3 py-2 text-xs disabled:opacity-60"
              >
                <Save size={14} />
                Save
              </button>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Product</th>
              <th className="px-5 py-4 font-medium">RDC</th>
              <th className="px-5 py-4 font-medium">Quantity</th>
              <th className="px-5 py-4 font-medium">Last Updated</th>
              <th className="px-5 py-4 font-medium">Save</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const product = products.find((productItem) => productItem.id === item.productId);
              const draftValue = drafts[item.id] ?? String(item.quantity ?? 0);
              return (
                <tr key={item.id} className="text-slate-700">
                  <td className="px-5 py-4 font-semibold text-slate-900">{product?.name ?? item.productId}</td>
                  <td className="px-5 py-4 capitalize">{item.rdcId}</td>
                  <td className="px-5 py-4">
                    <input
                      type="number"
                      min={0}
                      value={draftValue}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="input-field w-28 px-3 py-2"
                    />
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(item.updatedAt).toLocaleDateString("en-LK")}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={savingId === item.id}
                      onClick={async () => {
                        try {
                          setSavingId(item.id);
                          await onSave(item.id, Math.max(0, Number(draftValue || item.quantity || 0)));
                        } finally {
                          setSavingId(null);
                        }
                      }}
                      className="btn-primary px-3 py-2 text-xs disabled:opacity-60"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
