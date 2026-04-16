"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import ProductCard from "@/components/ProductCard";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { addToCart } from "@/services/cart.service";
import { getProductCategories, getProducts } from "@/services/product.service";
import {
  addOrUpdateReview,
  getReviewByCustomerAndProduct,
  getReviewsByProduct,
  getReviewSummaryMap,
} from "@/services/reviews.service";
import { Product, ProductReview } from "@/types";

function CustomerProductsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [activeProductId, setActiveProductId] = useState("");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<Record<string, { averageRating: number; reviewCount: number }>>({});
  const [existingReview, setExistingReview] = useState<ProductReview | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshProducts() {
    const nextProducts = await getProducts();
    setProducts(nextProducts);
    setCategories(await getProductCategories());
    setReviewSummaries(await getReviewSummaryMap(nextProducts.map((product) => product.id)));
  }

  async function loadReviewData(productId: string) {
    if (!productId || !user) {
      setReviews([]);
      setExistingReview(null);
      setCanReview(false);
      return;
    }

    setReviewLoading(true);
    try {
      const [nextReviews, nextExistingReview] = await Promise.all([
        getReviewsByProduct(productId),
        getReviewByCustomerAndProduct(user.id, productId),
      ]);
      setReviews(nextReviews);
      setExistingReview(nextExistingReview);
      setCanReview(true);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load product reviews.");
      setReviews([]);
      setExistingReview(null);
      setCanReview(false);
    } finally {
      setReviewLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      await refreshProducts();
    }

    void loadData();
  }, []);

  useEffect(() => {
    const queryProductId = searchParams.get("reviewProduct");
    if (queryProductId && products.some((product) => product.id === queryProductId)) {
      setActiveProductId(queryProductId);
    }
  }, [products, searchParams]);

  useEffect(() => {
    if (!activeProductId) {
      setReviews([]);
      setExistingReview(null);
      setCanReview(false);
      return;
    }

    void loadReviewData(activeProductId);
  }, [activeProductId, user]);

  const filteredProducts = useMemo(
    () => {
      const nextProducts = products.filter((product) => {
        if (category !== "All" && product.category !== category) {
          return false;
        }
        if (search && !`${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      });

      if (sortBy === "price_low") {
        return [...nextProducts].sort((a, b) => a.price - b.price);
      }

      if (sortBy === "price_high") {
        return [...nextProducts].sort((a, b) => b.price - a.price);
      }

      if (sortBy === "stock") {
        return [...nextProducts].sort((a, b) => b.stock - a.stock);
      }

      return nextProducts;
    },
    [category, products, search, sortBy],
  );
  const activeProduct = products.find((product) => product.id === activeProductId) ?? null;
  const activeSummary = activeProduct ? reviewSummaries[activeProduct.id] ?? { averageRating: 0, reviewCount: 0 } : null;

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell
        title="Browse Products"
        description="Search product lines, filter categories, and add items to your cart with real stock validation."
      >
        <section className="hero-banner rounded-[1.75rem] p-6 shadow-[0_18px_50px_rgba(245,114,36,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">ISDN Marketplace</p>
              <h2 className="mt-3 text-3xl font-extrabold text-white">Shop popular distribution products by category.</h2>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur">
              {filteredProducts.length} products available
            </div>
          </div>
        </section>

        <section className="surface-card grid gap-4 rounded-[1.5rem] p-5 lg:grid-cols-[1fr_220px_220px]">
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products by name or description"
              className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="select-field"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="select-field">
            <option value="featured">Featured</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="stock">Most Stock</option>
          </select>
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-[#f57224]">
            <SlidersHorizontal size={16} />
            Curated shopping results
          </div>
        </section>

        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}

        {filteredProducts.length === 0 ? (
          <EmptyState title="No products found" description="Try changing the search keyword or category filter." />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <ProductCard
                    product={product}
                    averageRating={reviewSummaries[product.id]?.averageRating ?? 0}
                    reviewCount={reviewSummaries[product.id]?.reviewCount ?? 0}
                    reviewsOpen={activeProductId === product.id}
                    onOpenReviews={(productId) =>
                      setActiveProductId((current) => (current === productId ? "" : productId))
                    }
                    onAddToCart={async (productId) => {
                      try {
                        setError("");
                        await addToCart(productId, 1);
                        setMessage("Product added to cart successfully.");
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Unable to add product to cart.");
                      }
                    }}
                  />
                </motion.div>
              ))}
            </section>

            {activeProduct ? (
              <section className="surface-soft rounded-[1.75rem] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <img
                      src={activeProduct.image64 || activeProduct.imageUrl || "https://placehold.co/240x240/f3f4f6/9ca3af?text=Product"}
                      alt={activeProduct.name}
                      className="h-24 w-24 shrink-0 rounded-[1.5rem] border border-slate-200 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="page-eyebrow">Review Product</p>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">{activeProduct.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{activeProduct.description}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setActiveProductId("")} className="btn-outline w-full justify-center sm:w-auto">
                    <X size={16} />
                    Close Reviews
                  </button>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <ReviewList
                    reviews={reviews}
                    averageRating={activeSummary?.averageRating ?? 0}
                    reviewCount={activeSummary?.reviewCount ?? 0}
                    loading={reviewLoading}
                  />

                  <ReviewForm
                    product={activeProduct}
                    existingReview={existingReview}
                    canReview={canReview}
                    loading={reviewSaving}
                    eligibilityMessage="All customers can submit or update a review for this product."
                    onSubmit={async ({ rating, comment }) => {
                      if (!user) {
                        return;
                      }

                      try {
                        setReviewSaving(true);
                        setError("");
                        await addOrUpdateReview({
                          productId: activeProduct.id,
                          customerId: user.id,
                          customerName: user.fullName,
                          customerAvatar64: user.avatar64,
                          rating,
                          comment,
                        });
                        setMessage(existingReview ? "Review updated successfully." : "Review submitted successfully.");
                        await refreshProducts();
                        await loadReviewData(activeProduct.id);
                      } catch (reviewError) {
                        setError(reviewError instanceof Error ? reviewError.message : "Unable to save review.");
                      } finally {
                        setReviewSaving(false);
                      }
                    }}
                  />
                </div>
              </section>
            ) : null}
          </>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}

export default function CustomerProductsPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute allowedRoles={["customer"]}>
          <DashboardShell
            title="Browse Products"
            description="Search product lines, filter categories, and add items to your cart with real stock validation."
          >
            <div className="surface-card rounded-[1.5rem] p-6 text-sm text-slate-600">
              Loading products...
            </div>
          </DashboardShell>
        </ProtectedRoute>
      }
    >
      <CustomerProductsContent />
    </Suspense>
  );
}
