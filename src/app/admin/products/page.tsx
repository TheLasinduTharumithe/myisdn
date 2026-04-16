"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ProductForm from "@/components/ProductForm";
import ProductTable from "@/components/ProductTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "@/services/product.service";
import { Product, ProductFormInput } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      setProducts(await getAllProducts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter((item) => {
        const matchesSearch = `${item.name} ${item.category} ${item.description}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && item.isActive) ||
          (statusFilter === "inactive" && !item.isActive);

        return matchesSearch && matchesStatus;
      }),
    [products, search, statusFilter],
  );

  async function handleSubmit(values: ProductFormInput) {
    try {
      setSaving(true);
      setError("");

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, values);
        setMessage(`Updated ${values.name} successfully.`);
      } else {
        await addProduct(values);
        setMessage(`Created ${values.name} successfully.`);
        setFormResetKey((current) => current + 1);
      }

      setSelectedProduct(null);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: Product) {
    if (!window.confirm(`Delete ${target.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(target.id);
      setError("");
      await deleteProduct(target.id);
      setMessage(`Deleted ${target.name} successfully.`);
      if (selectedProduct?.id === target.id) {
        setSelectedProduct(null);
      }
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete product.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "ho"]}>
      <DashboardShell
        title="Product Management"
        description="Create, update, search, and remove products from the shared catalog."
      >
        <section className="surface-soft rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="page-eyebrow">Catalog Control</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Manage products with image, price, and stock visibility</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Maintain the product catalog used across customer ordering, inventory control, and reporting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedProduct(null);
                setFormResetKey((current) => current + 1);
              }}
              className="btn-primary"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product name, category, or description"
                className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
              className="select-field"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </section>

        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}

        {loading ? (
          <LoadingState label="Loading products..." />
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <ProductForm
              mode={selectedProduct ? "edit" : "create"}
              resetSignal={formResetKey}
              initialValues={
                selectedProduct
                  ? {
                      id: selectedProduct.id,
                      name: selectedProduct.name,
                      category: selectedProduct.category,
                      description: selectedProduct.description,
                      price: selectedProduct.price,
                      stock: selectedProduct.stock,
                      image64: selectedProduct.image64 ?? "",
                      isActive: selectedProduct.isActive,
                    }
                  : undefined
              }
              loading={saving}
              onCancel={
                selectedProduct
                  ? () => {
                      setSelectedProduct(null);
                      setFormResetKey((current) => current + 1);
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
            />

            {filteredProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try a different search or status filter, or create a new product from the form."
              />
            ) : (
              <ProductTable
                products={filteredProducts}
                deletingId={deletingId}
                onEdit={setSelectedProduct}
                onDelete={(target) => void handleDelete(target)}
              />
            )}
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
