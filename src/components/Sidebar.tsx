"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  CreditCard,
  Gauge,
  MapPinned,
  Package,
  Route,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  onNavigate?: () => void;
}

const navItems: Record<UserRole, Array<{ href: string; label: string; icon: typeof Gauge }>> = {
  customer: [
    { href: "/customer/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/customer/products", label: "Products", icon: ShoppingBag },
    { href: "/customer/cart", label: "Cart", icon: CreditCard },
    { href: "/customer/orders", label: "Orders", icon: ClipboardList },
  ],
  rdc: [
    { href: "/rdc/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/rdc/inventory", label: "Inventory", icon: Boxes },
    { href: "/rdc/orders", label: "Orders", icon: ClipboardList },
    { href: "/rdc/transfers", label: "Transfers", icon: Route },
  ],
  logistics: [
    { href: "/logistics/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/logistics/deliveries", label: "Deliveries", icon: Truck },
  ],
  ho: [
    { href: "/ho/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/ho/orders", label: "Orders", icon: ClipboardList },
    { href: "/ho/reports", label: "Reports", icon: MapPinned },
    { href: "/ho/users", label: "Users", icon: Users },
    { href: "/ho/products", label: "Products", icon: Package },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/products", label: "Products", icon: Package },
  ],
};

export default function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="surface-card sticky top-24 flex h-[calc(100vh-7.5rem)] flex-col rounded-[1.75rem] p-4">
      <div className="hero-banner mb-8 rounded-[1.5rem] p-5 shadow-sm">
        <div className="inline-flex rounded-2xl bg-white/18 p-3">
          <Sparkles size={18} />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white/80">ISDN Workspace</p>
        <h2 className="mt-3 text-xl font-bold text-white">Distribution operations made simple.</h2>
        <p className="mt-3 text-sm leading-6 text-white/85">Clean navigation for orders, stock, reports, and fulfilment.</p>
      </div>

      <nav className="space-y-2">
        {navItems[role].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition",
                active
                  ? "bg-orange-50 text-[#f57224] ring-1 ring-orange-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
