"use client";

import { FormEvent, useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { RDC_OPTIONS } from "@/lib/utils";
import { transferStock } from "@/services/inventory.service";
import { getProducts } from "@/services/product.service";
import { Product, RdcId } from "@/types";

export default function RdcTransfersPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [toRdcId, setToRdcId] = useState<RdcId>("central");
  const [quantity, setQuantity] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const productList = await getProducts();
      setProducts(productList);
      setProductId(productList[0]?.id ?? "");
      const firstDestination = RDC_OPTIONS.find((option) => option.value !== user?.rdcId);
      if (firstDestination) {
        setToRdcId(firstDestination.value);
      }
    }

    void loadProducts();
  }, [user?.rdcId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user?.rdcId) {
      return;
    }

    try {
      await transferStock(productId, user.rdcId, toRdcId, quantity);
      setMessage("Stock transfer completed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed.");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["rdc"]}>
      <DashboardShell title="Stock Transfers" description="Move stock between distribution centres to balance supply and respond to regional demand.">
        <form onSubmit={handleSubmit} className="surface-card grid gap-5 rounded-[2rem] p-6 md:grid-cols-2">
          <label className="block">
            <span className="field-label">Product</span>
            <select value={productId} onChange={(event) => setProductId(event.target.value)} className="select-field w-full">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Destination RDC</span>
            <select value={toRdcId} onChange={(event) => setToRdcId(event.target.value as RdcId)} className="select-field w-full">
              {RDC_OPTIONS.filter((option) => option.value !== user?.rdcId).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Quantity</span>
            <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="input-field w-full" />
          </label>

          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full justify-center">
              Complete Transfer
            </button>
          </div>

          {error ? <p className="notice-error md:col-span-2">{error}</p> : null}
          {message ? <p className="notice-success md:col-span-2">{message}</p> : null}
        </form>
      </DashboardShell>
    </ProtectedRoute>
  );
}
