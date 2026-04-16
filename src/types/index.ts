export type UserRole = "customer" | "rdc" | "logistics" | "ho" | "admin";

export type RdcId = "north" | "south" | "east" | "west" | "central";

export type OrderStatus =
  | "pending"
  | "placed"
  | "awaiting_confirmation"
  | "approved"
  | "packed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type DeliveryStatus =
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "nearby"
  | "delivered"
  | "delayed";

export type PaymentMethod = "card" | "bank_transfer" | "cash_on_delivery";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface GeoPointLike {
  lat: number;
  lng: number;
}

export interface OsrmRouteResult {
  coordinates: GeoPointLike[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  avatar64?: string;
  rdcId?: RdcId;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image64?: string;
  imageUrl?: string;
  isActive: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  customerAvatar64?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewInput {
  productId: string;
  customerId: string;
  customerName: string;
  customerAvatar64?: string;
  rating: number;
  comment?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  productName?: string;
  image64?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryLocation?: GeoPointLike;
  rdcId: RdcId;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  inventoryReducedAt?: string;
  inventoryRestoredAt?: string;
  updatedAt?: string;
}

export interface Inventory {
  id: string;
  productId: string;
  rdcId: RdcId;
  quantity: number;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  customerId?: string;
  rdcId?: RdcId;
  driverId: string;
  status: DeliveryStatus;
  customerLocation?: GeoPointLike;
  currentLocation: GeoPointLike;
  customerAddress?: string;
  updatedAt: string;
  estimatedDelivery: string;
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paymentStatus?: PaymentStatus;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  fromRdcId: RdcId;
  toRdcId: RdcId;
  quantity: number;
  status: "completed";
  createdAt: string;
}

export interface ProductFilterInput {
  search?: string;
  category?: string;
  showInactive?: boolean;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  avatar64?: string;
  role?: UserRole;
  rdcId?: RdcId;
}

export interface UserFormInput {
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  address: string;
  avatar64: string;
  rdcId?: RdcId;
}

export interface ProductFormInput {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image64: string;
  isActive: boolean;
}

export interface PlaceOrderInput {
  customerId: string;
  customerName?: string;
  deliveryAddress: string;
  deliveryLocation?: GeoPointLike;
  paymentMethod: PaymentMethod;
  rdcId: RdcId;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface ReportSummary {
  totalUsers?: number;
  totalProducts?: number;
  totalOrders: number;
  totalSales: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockItems: number;
  deliveryPerformance: number;
  totalCustomers: number;
  totalStaff: number;
}

export interface MonthlySalesPoint {
  month: string;
  sales: number;
  orders: number;
}

export interface RdcPerformancePoint {
  rdcId: RdcId;
  orders: number;
  stock: number;
}

export interface PdfReportData {
  generatedAt: string;
  summary: ReportSummary;
  stockUnits: number;
  pendingDeliveries: number;
  activeDeliveries: number;
}
