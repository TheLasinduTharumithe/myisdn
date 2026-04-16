import {
  DEMO_CREDENTIALS,
  DEMO_DELIVERIES,
  DEMO_INVENTORY,
  DEMO_ORDERS,
  DEMO_ORDER_ITEMS,
  DEMO_PAYMENTS,
  DEMO_PRODUCTS,
  DEMO_REPORTS,
  DEMO_USERS,
} from "@/lib/demo-data";

const STORAGE_KEYS = {
  users: "isdn_users",
  credentials: "isdn_credentials",
  products: "isdn_products",
  orders: "isdn_orders",
  orderItems: "isdn_order_items",
  inventory: "isdn_inventory",
  deliveries: "isdn_deliveries",
  payments: "isdn_payments",
  reports: "isdn_reports",
  cart: "isdn_cart",
  session: "isdn_session",
  transfers: "isdn_transfers",
} as const;

const DEMO_COLLECTIONS = {
  [STORAGE_KEYS.users]: DEMO_USERS,
  [STORAGE_KEYS.credentials]: DEMO_CREDENTIALS,
  [STORAGE_KEYS.products]: DEMO_PRODUCTS,
  [STORAGE_KEYS.orders]: DEMO_ORDERS,
  [STORAGE_KEYS.orderItems]: DEMO_ORDER_ITEMS,
  [STORAGE_KEYS.inventory]: DEMO_INVENTORY,
  [STORAGE_KEYS.deliveries]: DEMO_DELIVERIES,
  [STORAGE_KEYS.payments]: DEMO_PAYMENTS,
  [STORAGE_KEYS.reports]: DEMO_REPORTS,
  [STORAGE_KEYS.cart]: [],
  [STORAGE_KEYS.session]: null,
  [STORAGE_KEYS.transfers]: [],
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

export function ensureSeedData() {
  if (!isBrowser()) {
    return;
  }

  Object.entries(DEMO_COLLECTIONS).forEach(([key, value]) => {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  });
}

export function readCollection<T>(key: keyof typeof STORAGE_KEYS): T {
  if (!isBrowser()) {
    return structuredClone(DEMO_COLLECTIONS[STORAGE_KEYS[key]]) as T;
  }

  ensureSeedData();
  const raw = window.localStorage.getItem(STORAGE_KEYS[key]);
  return raw ? (JSON.parse(raw) as T) : (structuredClone(DEMO_COLLECTIONS[STORAGE_KEYS[key]]) as T);
}

export function writeCollection<T>(key: keyof typeof STORAGE_KEYS, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
}

export function getStorageKey(key: keyof typeof STORAGE_KEYS) {
  return STORAGE_KEYS[key];
}

