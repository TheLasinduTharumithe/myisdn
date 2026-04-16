"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  reviewCount?: number;
  showValue?: boolean;
  interactive?: boolean;
  size?: number;
  className?: string;
}

export default function ProductRating({
  value,
  onChange,
  reviewCount,
  showValue = true,
  interactive = false,
  size = 16,
  className,
}: ProductRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const roundedValue = Math.round(Math.max(0, Math.min(5, interactive && hoverValue ? hoverValue : value)));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(0)}>
        {Array.from({ length: 5 }, (_, index) => {
          const starNumber = index + 1;
          const filled = starNumber <= roundedValue;

          if (interactive) {
            return (
              <button
                key={starNumber}
                type="button"
                onClick={() => onChange?.(starNumber)}
                onMouseEnter={() => setHoverValue(starNumber)}
                className="rounded-full p-1 transition hover:scale-105"
                aria-label={`Rate ${starNumber} star${starNumber > 1 ? "s" : ""}`}
              >
                <Star
                  size={size}
                  className={filled ? "fill-[#f59e0b] text-[#f59e0b]" : "text-slate-300"}
                />
              </button>
            );
          }

          return (
            <Star
              key={starNumber}
              size={size}
              className={filled ? "fill-[#f59e0b] text-[#f59e0b]" : "text-slate-300"}
            />
          );
        })}
      </div>

      {showValue ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{value > 0 ? value.toFixed(1) : "0.0"}</span>
          {typeof reviewCount === "number" ? <span>({reviewCount} review{reviewCount === 1 ? "" : "s"})</span> : null}
        </div>
      ) : null}
    </div>
  );
}
