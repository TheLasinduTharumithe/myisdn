import { RdcId, UserRole } from "@/types";

export const DEMO_PASSWORD = "Demo@12345";

export const RDC_OPTIONS: Array<{ label: string; value: RdcId }> = [
  { label: "North RDC", value: "north" },
  { label: "South RDC", value: "south" },
  { label: "East RDC", value: "east" },
  { label: "West RDC", value: "west" },
  { label: "Central RDC", value: "central" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  rdc: "RDC Staff",
  logistics: "Logistics Staff",
  ho: "Head Office",
  admin: "Admin",
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${random}`;
}

export function getDashboardPath(role: UserRole) {
  switch (role) {
    case "customer":
      return "/customer/dashboard";
    case "rdc":
      return "/rdc/dashboard";
    case "logistics":
      return "/logistics/dashboard";
    case "ho":
      return "/ho/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}

export function getRdcLabel(rdcId?: RdcId) {
  return RDC_OPTIONS.find((item) => item.value === rdcId)?.label ?? "Island-wide";
}

export function getStatusTone(status: string) {
  if (["paid", "delivered"].includes(status)) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (["approved", "packed", "processing", "shipped", "picked_up", "in_transit", "nearby"].includes(status)) {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  if (["pending", "placed", "awaiting_confirmation", "assigned"].includes(status)) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
}
