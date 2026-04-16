"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import InventoryTable from "@/components/InventoryTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { ensureInventoryRecord, getInventory, updateInventoryQuantity } from "@/services/inventory.service";
import { getProducts } from "@/services/product.service";
import { Inventory, Product } from "@/types";

export default function RdcInventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    if (!user?.rdcId) {
      return;
    }

    const productList = await getProducts({ showInactive: true });
    await Promise.all(productList.map((product) => ensureInventoryRecord(product.id, user.rdcId!)));
    const items = await getInventory(user.rdcId);
    setInventory(items);
    setProducts(productList);
  }

  useEffect(() => {
    void refresh();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["rdc"]}>
      <DashboardShell title="Inventory Management" description="Update regional stock counts and keep order fulfilment data accurate for your distribution centre.">
        <section className="surface-soft flex flex-col gap-4 rounded-[2rem] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="page-eyebrow">Inventory Desk</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Update stock counts with confidence</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Keep quantities accurate for order approval, transfer planning, and low-stock monitoring.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Items loaded: <span className="font-bold text-slate-900">{inventory.length}</span>
          </div>
        </section>
        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}
        <InventoryTable
          inventory={inventory}
          products={products}
          onSave={async (inventoryId, quantity) => {
            try {
              setError("");
              await updateInventoryQuantity(inventoryId, quantity);
              setMessage("Inventory updated successfully.");
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to update inventory.");
            }
          }}
        />
      </DashboardShell>
    </ProtectedRoute>
  );
}
