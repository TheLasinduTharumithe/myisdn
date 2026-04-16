"use client";

import { motion } from "framer-motion";
import { MessageSquareText, ShoppingCart, Tag } from "lucide-react";
import ProductRating from "@/components/ProductRating";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  averageRating?: number;
  reviewCount?: number;
  reviewsOpen?: boolean;
  onAddToCart?: (productId: string) => Promise<void> | void;
  onOpenReviews?: (productId: string) => void;
}

export default function ProductCard({
  product,
  averageRating = 0,
  reviewCount = 0,
  reviewsOpen = false,
  onAddToCart,
  onOpenReviews,
}: ProductCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="surface-card group overflow-hidden rounded-[1.5rem]"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={product.image64 || product.imageUrl || "https://placehold.co/800x600/f3f4f6/9ca3af?text=Product"}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-slate-900/30 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {product.category}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[#f57224] shadow-sm">
          {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{product.description}</p>
          </div>
          <div className="rounded-2xl bg-orange-50 p-3 text-[#f57224]">
            <Tag size={18} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
          <ProductRating value={averageRating} reviewCount={reviewCount} />
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-extrabold text-[#f57224]">{formatCurrency(product.price)}</p>
            <p className="mt-1 text-sm text-slate-500">{product.stock} units available</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => onAddToCart?.(product.id)}
              disabled={product.stock <= 0}
              className="btn-primary w-full justify-center px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => onOpenReviews?.(product.id)}
              className="btn-outline w-full justify-center px-4 py-3 text-sm sm:w-auto"
            >
              <MessageSquareText size={16} />
              {reviewsOpen ? "Hide Reviews" : "View Reviews"}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
