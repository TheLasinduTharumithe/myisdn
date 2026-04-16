import {
  AppUser,
  Delivery,
  Inventory,
  Order,
  OrderItem,
  Payment,
  Product,
  RdcId,
} from "@/types";
import { DEMO_PASSWORD } from "@/lib/utils";

export const DEMO_USERS: AppUser[] = [
  {
    id: "user_customer_1",
    fullName: "Nadeesha Perera",
    email: "customer@isdn.lk",
    role: "customer",
    createdAt: "2026-04-10T09:00:00.000Z",
  },
  {
    id: "user_rdc_west_1",
    fullName: "Ishara Fernando",
    email: "rdc@isdn.lk",
    role: "rdc",
    rdcId: "west",
    createdAt: "2026-04-10T09:10:00.000Z",
  },
  {
    id: "user_logistics_1",
    fullName: "Sasanka De Silva",
    email: "logistics@isdn.lk",
    role: "logistics",
    createdAt: "2026-04-10T09:20:00.000Z",
  },
  {
    id: "user_ho_1",
    fullName: "Dilini Jayawardena",
    email: "manager@isdn.lk",
    role: "ho",
    createdAt: "2026-04-10T09:30:00.000Z",
  },
  {
    id: "user_admin_1",
    fullName: "System Admin",
    email: "admin@isdn.lk",
    role: "admin",
    createdAt: "2026-04-10T09:40:00.000Z",
  },
];

export const DEMO_CREDENTIALS = DEMO_USERS.map((user) => ({
  email: user.email,
  password: DEMO_PASSWORD,
  userId: user.id,
}));

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    name: "Lanka Premium Rice 5kg",
    category: "Groceries",
    description: "High quality local rice bag for retail distribution.",
    price: 2450,
    stock: 420,
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_002",
    name: "SunFresh Coconut Oil 1L",
    category: "Essentials",
    description: "Island-wide fast moving household cooking oil.",
    price: 1390,
    stock: 360,
    imageUrl:
      "https://images.unsplash.com/photo-1628773822503-930a7eaecf6d?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_003",
    name: "BlueWave Mineral Water 12 Pack",
    category: "Beverages",
    description: "Packed bottled water for supermarkets and mini-marts.",
    price: 1180,
    stock: 520,
    imageUrl:
      "https://images.unsplash.com/photo-1564419320476-534f5ca5f63b?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_004",
    name: "Harvest Milk Powder 400g",
    category: "Dairy",
    description: "Retail milk powder pack with strong demand across RDCs.",
    price: 1295,
    stock: 275,
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_005",
    name: "Urban Soap Value Pack",
    category: "Personal Care",
    description: "Bulk selling hygiene pack suitable for outlet restocking.",
    price: 860,
    stock: 610,
    imageUrl:
      "https://images.unsplash.com/photo-1584473457409-ce225aeff18e?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_006",
    name: "Spark Detergent 2kg",
    category: "Cleaning",
    description: "Popular detergent product distributed to all regions.",
    price: 1740,
    stock: 198,
    imageUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_007",
    name: "QuickBite Biscuits Family Pack",
    category: "Snacks",
    description: "Fast-moving snack range for convenience outlets.",
    price: 640,
    stock: 490,
    imageUrl:
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
  {
    id: "prod_008",
    name: "FreshLeaf Tea 200g",
    category: "Beverages",
    description: "Premium tea product frequently featured in promotions.",
    price: 980,
    stock: 250,
    imageUrl:
      "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=80",
    isActive: true,
  },
];

function inventoryQuantity(base: number, rdcId: RdcId) {
  const multiplier: Record<RdcId, number> = {
    north: 0.8,
    south: 1.05,
    east: 0.75,
    west: 1.15,
    central: 1.25,
  };

  return Math.floor(base * multiplier[rdcId] * 0.18);
}

export const DEMO_INVENTORY: Inventory[] = DEMO_PRODUCTS.flatMap((product) =>
  (["north", "south", "east", "west", "central"] as RdcId[]).map((rdcId) => ({
    id: `inv_${product.id}_${rdcId}`,
    productId: product.id,
    rdcId,
    quantity: inventoryQuantity(product.stock, rdcId),
    updatedAt: "2026-04-15T07:00:00.000Z",
  })),
);

export const DEMO_ORDER_ITEMS: OrderItem[] = [
  {
    id: "oi_001",
    orderId: "order_001",
    productId: "prod_001",
    quantity: 3,
    price: 2450,
    productName: "Lanka Premium Rice 5kg",
  },
  {
    id: "oi_002",
    orderId: "order_001",
    productId: "prod_003",
    quantity: 2,
    price: 1180,
    productName: "BlueWave Mineral Water 12 Pack",
  },
  {
    id: "oi_003",
    orderId: "order_002",
    productId: "prod_005",
    quantity: 6,
    price: 860,
    productName: "Urban Soap Value Pack",
  },
  {
    id: "oi_004",
    orderId: "order_003",
    productId: "prod_006",
    quantity: 2,
    price: 1740,
    productName: "Spark Detergent 2kg",
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "order_001",
    customerId: "user_customer_1",
    items: DEMO_ORDER_ITEMS.filter((item) => item.orderId === "order_001"),
    totalAmount: 9710,
    status: "out_for_delivery",
    deliveryAddress: "24 Galle Road, Colombo 03",
    deliveryLocation: { lat: 6.9044, lng: 79.8538 },
    rdcId: "west",
    createdAt: "2026-04-14T10:30:00.000Z",
  },
  {
    id: "order_002",
    customerId: "user_customer_1",
    items: DEMO_ORDER_ITEMS.filter((item) => item.orderId === "order_002"),
    totalAmount: 5160,
    status: "approved",
    deliveryAddress: "15 Temple Street, Kandy",
    deliveryLocation: { lat: 7.2903, lng: 80.6331 },
    rdcId: "central",
    createdAt: "2026-04-13T08:15:00.000Z",
  },
  {
    id: "order_003",
    customerId: "user_customer_1",
    items: DEMO_ORDER_ITEMS.filter((item) => item.orderId === "order_003"),
    totalAmount: 3480,
    status: "pending",
    deliveryAddress: "88 Main Street, Galle",
    deliveryLocation: { lat: 6.0329, lng: 80.2168 },
    rdcId: "south",
    createdAt: "2026-04-15T11:45:00.000Z",
  },
];

export const DEMO_DELIVERIES: Delivery[] = [
  {
    id: "delivery_001",
    orderId: "order_001",
    driverId: "user_logistics_1",
    status: "in_transit",
    customerLocation: { lat: 6.9044, lng: 79.8538 },
    currentLocation: { lat: 6.9271, lng: 79.8612 },
    estimatedDelivery: "2026-04-16T18:30:00.000Z",
    updatedAt: "2026-04-16T12:15:00.000Z",
  },
  {
    id: "delivery_002",
    orderId: "order_002",
    driverId: "user_logistics_1",
    status: "assigned",
    customerLocation: { lat: 7.2903, lng: 80.6331 },
    currentLocation: { lat: 7.2906, lng: 80.6337 },
    estimatedDelivery: "2026-04-17T14:00:00.000Z",
    updatedAt: "2026-04-15T08:00:00.000Z",
  },
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: "payment_001",
    orderId: "order_001",
    customerId: "user_customer_1",
    amount: 9710,
    method: "card",
    paymentStatus: "paid",
    createdAt: "2026-04-14T10:31:00.000Z",
  },
  {
    id: "payment_002",
    orderId: "order_002",
    customerId: "user_customer_1",
    amount: 5160,
    method: "bank_transfer",
    paymentStatus: "paid",
    createdAt: "2026-04-13T08:20:00.000Z",
  },
  {
    id: "payment_003",
    orderId: "order_003",
    customerId: "user_customer_1",
    amount: 3480,
    method: "cash_on_delivery",
    paymentStatus: "pending",
    createdAt: "2026-04-15T11:50:00.000Z",
  },
];

export const DEMO_REPORTS = [
  { month: "Jan", sales: 320000, orders: 128 },
  { month: "Feb", sales: 410000, orders: 162 },
  { month: "Mar", sales: 465000, orders: 178 },
  { month: "Apr", sales: 520000, orders: 201 },
  { month: "May", sales: 490000, orders: 190 },
  { month: "Jun", sales: 575000, orders: 226 },
];
