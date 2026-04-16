"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getCart, getCartTotals, removeFromCart, updateCartQuantity } from "@/services/cart.service";
import { CartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function CustomerCartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshCart() {
    const nextCart = await getCart();
    const totals = await getCartTotals();
    setCart(nextCart);
    setSubtotal(totals.subtotal);
  }

  useEffect(() => {
    void refreshCart();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardShell
        title="Shopping Cart"
        description="Review item quantities before placing your order. Stock limits are validated before checkout."
      >
        {message ? <p className="notice-info">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}

        {cart.length === 0 ? (
          <EmptyState title="Your cart is empty" description="Add products from the catalog to begin a new order." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="table-shell">
              <div className="space-y-3 p-4 md:hidden">
                {cart.map((item) => (
                  <article key={item.productId} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image64 || item.product.imageUrl || "https://placehold.co/180x180/f3f4f6/9ca3af?text=Product"}
                        alt={item.product.name}
                        className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{item.product.name}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.product.category}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(item.product.price)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quantity</span>
                        <input
                          type="number"
                          min={1}
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={async (event) => {
                            try {
                              setError("");
                              await updateCartQuantity(item.productId, Number(event.target.value));
                              setMessage("Cart quantity updated.");
                              await refreshCart();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Unable to update cart.");
                            }
                          }}
                          className="input-field mt-2 w-full px-3 py-2"
                        />
                      </label>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</p>
                        <p className="mt-3 font-semibold text-[#f57224]">{formatCurrency(item.quantity * item.product.price)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setError("");
                          await removeFromCart(item.productId);
                          setMessage("Item removed from cart.");
                          await refreshCart();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Unable to remove item.");
                        }
                      }}
                      className="btn-danger mt-4 w-full justify-center px-3 py-2 text-xs"
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Product</th>
                      <th className="px-5 py-4 font-medium">Unit Price</th>
                      <th className="px-5 py-4 font-medium">Quantity</th>
                      <th className="px-5 py-4 font-medium">Total</th>
                      <th className="px-5 py-4 font-medium">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId} className="text-slate-700">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.product.image64 || item.product.imageUrl || "https://placehold.co/180x180/f3f4f6/9ca3af?text=Product"}
                              alt={item.product.name}
                              className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{item.product.name}</p>
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(item.product.price)}</td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min={1}
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={async (event) => {
                              try {
                                setError("");
                                await updateCartQuantity(item.productId, Number(event.target.value));
                                setMessage("Cart quantity updated.");
                                await refreshCart();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Unable to update cart.");
                              }
                            }}
                            className="input-field w-24 px-3 py-2"
                          />
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#f57224]">{formatCurrency(item.quantity * item.product.price)}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setError("");
                                await removeFromCart(item.productId);
                                setMessage("Item removed from cart.");
                                await refreshCart();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Unable to remove item.");
                              }
                            }}
                            className="btn-danger px-3 py-2 text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="surface-soft rounded-[1.5rem] p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Order Summary</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-orange-100 pt-4 text-base font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <Link href="/customer/payment" className="btn-primary mt-8 flex w-full justify-center">
                Proceed to Checkout
              </Link>
            </aside>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
