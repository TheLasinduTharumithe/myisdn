"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import {
  IMAGE_INPUT_ACCEPT,
  fileToBase64,
  getImageValidationText,
} from "@/lib/avatar64";
import { ProductFormInput } from "@/types";

const defaultValues: ProductFormInput = {
  name: "",
  category: "",
  description: "",
  price: 0,
  stock: 0,
  image64: "",
  isActive: true,
};

interface ProductFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<ProductFormInput>;
  resetSignal?: number;
  loading?: boolean;
  error?: string;
  onCancel?: () => void;
  onSubmit: (values: ProductFormInput) => Promise<void> | void;
}

export default function ProductForm({
  mode,
  initialValues,
  resetSignal = 0,
  loading = false,
  error = "",
  onCancel,
  onSubmit,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormInput>(defaultValues);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    setForm({
      ...defaultValues,
      ...initialValues,
    });
    setImageError("");
  }, [initialValues, mode, resetSignal]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImageError("");
      const image64 = await fileToBase64(file);
      setForm((current) => ({ ...current, image64 }));
    } catch (uploadError) {
      setImageError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImageError("");

    if (!form.name.trim() || !form.category.trim() || !form.description.trim()) {
      setImageError("Name, category, and description are required.");
      return;
    }

    if (form.price < 0 || form.stock < 0) {
      setImageError("Price and stock must be zero or greater.");
      return;
    }

    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card grid h-fit content-start gap-4 self-start rounded-[2rem] p-6">
      <div>
        <p className="page-eyebrow">{mode === "create" ? "Add Product" : "Edit Product"}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {mode === "create" ? "Create a catalog entry" : "Update product details"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Maintain product availability, pricing, and product image presentation from one clean form.
        </p>
      </div>

      <div className="surface-soft rounded-[1.5rem] p-5">
        <div className="grid gap-4 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                form.image64 ||
                "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
              }
              alt={form.name || "Product preview"}
              className="h-44 w-full rounded-2xl object-cover"
            />
          </div>
          <div>
            <p className="field-label">Product Image</p>
            <p className="text-sm text-slate-600">{getImageValidationText()}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="btn-primary cursor-pointer">
                <ImagePlus size={16} />
                Upload Image
                <input type="file" accept={IMAGE_INPUT_ACCEPT} onChange={handleImageChange} className="hidden" />
              </label>
              {form.image64 ? (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setForm((current) => ({ ...current, image64: "" }))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="field-label">Product Name</span>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          className="input-field"
          placeholder="Enter product name"
        />
      </label>

      <label className="block">
        <span className="field-label">Category</span>
        <input
          type="text"
          value={form.category}
          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          className="input-field"
          placeholder="Enter category"
        />
      </label>

      <label className="block">
        <span className="field-label">Description</span>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="textarea-field"
          rows={4}
          placeholder="Enter a short product description"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Price</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
            className="input-field"
            placeholder="0.00"
          />
        </label>
        <label className="block">
          <span className="field-label">Stock</span>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))}
            className="input-field"
            placeholder="0"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
        />
        Product active
      </label>

      {imageError ? <p className="notice-error">{imageError}</p> : null}
      {error ? <p className="notice-error">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}
        </button>
        {mode === "edit" && onCancel ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
