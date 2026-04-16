import { readCollection, writeCollection } from "@/lib/local-db";
import { createId } from "@/lib/utils";
import { clearCart } from "@/services/cart.service";
import { createDelivery, getDeliveryByOrderId, updateDeliveryStatus } from "@/services/delivery.service";
import {
  reduceInventoryForOrder,
  restoreInventoryForCancelledOrder,
  restoreInventoryReduction,
  validateInventoryForOrder,
} from "@/services/inventory.service";
import { createPayment, getPaymentByOrder, markPaymentStatus } from "@/services/payment.service";
import { getProductById } from "@/services/product.service";
import { canUseFirestore, listDocs, setDocById } from "@/services/service-helpers";
import { Order, OrderItem, OrderStatus, PlaceOrderInput } from "@/types";

const COLLECTION = "orders";
const ORDER_ITEMS_COLLECTION = "orderItems";

function normalizeDate(value: unknown) {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return "";
}

function normalizeNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  switch (normalized) {
    case "new":
    case "pending":
      return "pending";
    case "placed":
      return "placed";
    case "awaiting_confirmation":
    case "awaiting confirmation":
      return "awaiting_confirmation";
    case "approved":
    case "confirmed":
    case "accepted":
      return "approved";
    case "packed":
      return "packed";
    case "processing":
    case "packing":
      return "processing";
    case "shipped":
      return "shipped";
    case "out_for_delivery":
    case "out for delivery":
    case "dispatched":
    case "in_delivery":
      return "out_for_delivery";
    case "delivered":
    case "completed":
      return "delivered";
    case "cancelled":
    case "canceled":
    case "rejected":
      return "cancelled";
    default:
      return "pending";
  }
}

function normalizeRdcId(value: unknown): Order["rdcId"] {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalized.includes("north")) {
    return "north";
  }
  if (normalized.includes("south")) {
    return "south";
  }
  if (normalized.includes("east")) {
    return "east";
  }
  if (normalized.includes("central")) {
    return "central";
  }

  return "west";
}

function normalizeOrderItem(orderId: string, value: unknown, index: number): OrderItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const quantity = Math.max(
    0,
    normalizeNumber(record.quantity, record.qty, record.count),
  );

  if (quantity <= 0) {
    return null;
  }

  return {
    id:
      typeof record.id === "string" && record.id
        ? record.id
        : `${orderId}_item_${index + 1}`,
    orderId,
    productId:
      typeof record.productId === "string" && record.productId
        ? record.productId
        : typeof record.productID === "string" && record.productID
          ? record.productID
          : typeof record.sku === "string" && record.sku
            ? record.sku
            : "",
    productName:
      typeof record.productName === "string" && record.productName
        ? record.productName
        : typeof record.name === "string" && record.name
          ? record.name
          : typeof record.title === "string" && record.title
            ? record.title
            : typeof record.itemName === "string" && record.itemName
              ? record.itemName
              : "Product",
    image64: typeof record.image64 === "string" ? record.image64 : "",
    quantity,
    price: normalizeNumber(record.price, record.unitPrice, record.amount),
  };
}

function normalizeOrder(
  value: Record<string, unknown>,
  fallbackItems: OrderItem[],
) {
  const orderId = typeof value.id === "string" && value.id ? value.id : createId("order");
  const rawItems = Array.isArray(value.items)
    ? value.items
    : Array.isArray(value.cartItems)
      ? value.cartItems
      : Array.isArray(value.products)
        ? value.products
        : [];

  const normalizedItems = rawItems
    .map((item, index) => normalizeOrderItem(orderId, item, index))
    .filter((item): item is OrderItem => Boolean(item));

  const items = normalizedItems.length > 0 ? normalizedItems : fallbackItems;

  return {
    id: orderId,
    customerId:
      typeof value.customerId === "string" && value.customerId
        ? value.customerId
        : typeof value.userId === "string" && value.userId
          ? value.userId
          : "",
    customerName: typeof value.customerName === "string" ? value.customerName : "",
    items,
    totalAmount:
      normalizeNumber(value.totalAmount, value.total, value.amount, value.subtotal) ||
      items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    status: normalizeOrderStatus(value.status),
    deliveryAddress:
      typeof value.deliveryAddress === "string" && value.deliveryAddress
        ? value.deliveryAddress
        : typeof value.address === "string"
          ? value.address
          : "",
    deliveryLocation:
      value.deliveryLocation && typeof value.deliveryLocation === "object"
        ? {
            lat: normalizeNumber((value.deliveryLocation as Record<string, unknown>).lat),
            lng: normalizeNumber((value.deliveryLocation as Record<string, unknown>).lng),
          }
        : undefined,
    rdcId: normalizeRdcId(value.rdcId ?? value.rdc ?? value.fulfillmentRdc),
    paymentStatus:
      value.paymentStatus === "pending" ||
      value.paymentStatus === "paid" ||
      value.paymentStatus === "failed" ||
      value.paymentStatus === "refunded"
        ? value.paymentStatus
        : undefined,
    createdAt: normalizeDate(value.createdAt ?? value.orderDate ?? value.date ?? value.timestamp),
    cancelledAt: normalizeDate(value.cancelledAt),
    cancelledBy: typeof value.cancelledBy === "string" ? value.cancelledBy : "",
    cancelReason: typeof value.cancelReason === "string" ? value.cancelReason : "",
    inventoryReducedAt: normalizeDate(value.inventoryReducedAt),
    inventoryRestoredAt: normalizeDate(value.inventoryRestoredAt),
    updatedAt: normalizeDate(value.updatedAt),
  } satisfies Order;
}

const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "placed",
  "awaiting_confirmation",
];

export function canCancelOrder(status: OrderStatus) {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}

export function getOrderCancellationMessage(order: Pick<Order, "customerId" | "status">, customerId?: string) {
  if (!customerId) {
    return "You must be signed in to cancel an order.";
  }

  if (order.customerId !== customerId) {
    return "You can cancel only your own orders.";
  }

  if (order.status === "cancelled") {
    return "This order has already been cancelled.";
  }

  if (!canCancelOrder(order.status)) {
    return "Cancellation is available only before RDC processing starts.";
  }

  return "";
}

export function canCustomerCancelOrder(order: Pick<Order, "customerId" | "status">, customerId?: string) {
  return getOrderCancellationMessage(order, customerId) === "";
}

async function persistOrderUpdate(orders: Order[], updated: Order) {
  if (canUseFirestore()) {
    await setDocById(COLLECTION, updated);
  }

  writeCollection(
    "orders",
    orders.map((order) => (order.id === updated.id ? updated : order)),
  );

  return updated;
}

async function updateOrderRecord(orderId: string, updates: Partial<Order>) {
  const orders = await getOrders();
  const target = orders.find((order) => order.id === orderId);
  if (!target) {
    throw new Error("Order not found.");
  }

  const updated: Order = {
    ...target,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return persistOrderUpdate(orders, updated);
}

export async function getOrders() {
  let rawOrders = canUseFirestore()
    ? await listDocs<Record<string, unknown>>(COLLECTION)
    : readCollection<Record<string, unknown>[]>("orders");
  let rawOrderItems = canUseFirestore()
    ? await listDocs<Record<string, unknown>>(ORDER_ITEMS_COLLECTION)
    : readCollection<Record<string, unknown>[]>("orderItems");

  if (rawOrders.length === 0) {
    rawOrders = readCollection<Record<string, unknown>[]>("orders");
  }

  if (rawOrderItems.length === 0) {
    rawOrderItems = readCollection<Record<string, unknown>[]>("orderItems");
  }

  const orderItemsByOrderId = rawOrderItems.reduce<Record<string, OrderItem[]>>((accumulator, item, index) => {
    const orderId =
      typeof item.orderId === "string" && item.orderId
        ? item.orderId
        : "";

    if (!orderId) {
      return accumulator;
    }

    const normalizedItem = normalizeOrderItem(orderId, item, index);
    if (!normalizedItem) {
      return accumulator;
    }

    accumulator[orderId] = [...(accumulator[orderId] ?? []), normalizedItem];
    return accumulator;
  }, {});

  return rawOrders
    .map((order) => {
      const orderId = typeof order.id === "string" && order.id ? order.id : "";
      return normalizeOrder(order, orderItemsByOrderId[orderId] ?? []);
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getOrderById(id: string) {
  const orders = await getOrders();
  return orders.find((order) => order.id === id) ?? null;
}

export async function getOrdersByCustomer(customerId: string) {
  const orders = await getOrders();
  return orders.filter((order) => order.customerId === customerId);
}

export async function getOrdersByRdc(rdcId: Order["rdcId"]) {
  const orders = await getOrders();
  return orders.filter((order) => order.rdcId === rdcId);
}

export async function placeOrder(input: PlaceOrderInput) {
  if (!input.items.length) {
    throw new Error("Your cart is empty.");
  }

  const orderId = createId("order");
  const now = new Date().toISOString();
  const orderItems: OrderItem[] = [];

  for (const item of input.items) {
    const product = await getProductById(item.productId);
    if (!product || !product.isActive) {
      throw new Error("One or more products are unavailable.");
    }
    if (item.quantity > product.stock) {
      throw new Error(`Only ${product.stock} units available for ${product.name}.`);
    }

    orderItems.push({
      id: createId("oi"),
      orderId,
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      productName: product.name,
    });
  }

  const order: Order = {
    id: orderId,
    customerId: input.customerId,
    customerName: input.customerName,
    items: orderItems,
    totalAmount: orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    status: "pending",
    deliveryAddress: input.deliveryAddress,
    deliveryLocation: input.deliveryLocation,
    rdcId: input.rdcId,
    paymentStatus: input.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
    createdAt: now,
  };

  if (canUseFirestore()) {
    await setDocById(COLLECTION, order);
    await Promise.all(orderItems.map((item) => setDocById(ORDER_ITEMS_COLLECTION, item)));
  }

  const orders = readCollection<Order[]>("orders");
  const orderItemsCollection = readCollection<OrderItem[]>("orderItems");
  writeCollection("orders", [order, ...orders]);
  writeCollection("orderItems", [...orderItems, ...orderItemsCollection]);

  await createPayment({
    orderId: order.id,
    customerId: order.customerId,
    amount: order.totalAmount,
    method: input.paymentMethod,
    paymentStatus: input.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
  });

  await clearCart();
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return updateOrderRecord(orderId, { status });
}

export async function manageOrderStatus(orderId: string, status: OrderStatus) {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  if (status === order.status) {
    return order;
  }

  if (status === "approved" && order.status === "pending") {
    return approveOrder(orderId);
  }

  const updatedOrder = await updateOrderStatus(orderId, status);
  const existingDelivery = await getDeliveryByOrderId(orderId);

  if (status === "out_for_delivery") {
    const delivery = existingDelivery ?? await createDelivery(updatedOrder);
    await updateDeliveryStatus(
      delivery.id,
      "in_transit",
      delivery.currentLocation,
      delivery.estimatedDelivery,
    );
  }

  if (status === "delivered") {
    const delivery = existingDelivery ?? await createDelivery(updatedOrder);
    await updateDeliveryStatus(
      delivery.id,
      "delivered",
      delivery.currentLocation,
      delivery.estimatedDelivery,
    );
  }

  if (status === "cancelled" && existingDelivery) {
    await updateDeliveryStatus(
      existingDelivery.id,
      "delayed",
      existingDelivery.currentLocation,
      existingDelivery.estimatedDelivery,
    );
  }

  return updatedOrder;
}

export async function approveOrder(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status !== "pending") {
    return order;
  }

  await validateInventoryForOrder(order.rdcId, order.items);

  let updatedOrder: Order | null = null;
  let inventorySnapshot: Awaited<ReturnType<typeof reduceInventoryForOrder>> | null = null;

  try {
    updatedOrder = await updateOrderStatus(orderId, "approved");
    inventorySnapshot = await reduceInventoryForOrder(order.rdcId, order.items);
    updatedOrder = await updateOrderRecord(orderId, {
      status: "approved",
      inventoryReducedAt: new Date().toISOString(),
      inventoryRestoredAt: undefined,
    });
    await createDelivery(updatedOrder);
    return updatedOrder;
  } catch (error) {
    if (inventorySnapshot) {
      await restoreInventoryReduction(inventorySnapshot);
    }

    if (updatedOrder) {
      await updateOrderRecord(orderId, {
        status: order.status,
        inventoryReducedAt: order.inventoryReducedAt,
        inventoryRestoredAt: order.inventoryRestoredAt,
      });
    }

    throw error;
  }
}

export async function cancelOrder(orderId: string, customerId: string, cancelReason?: string) {
  if (!customerId) {
    throw new Error("You must be signed in to cancel an order.");
  }

  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  const cancellationMessage = getOrderCancellationMessage(order, customerId);
  if (cancellationMessage) {
    throw new Error(cancellationMessage);
  }

  const restoredInventory = await restoreInventoryForCancelledOrder(order);
  const now = new Date().toISOString();
  const trimmedReason = cancelReason?.trim();

  const updatedOrder = await updateOrderRecord(orderId, {
    status: "cancelled",
    cancelledAt: now,
    cancelledBy: customerId,
    cancelReason: trimmedReason || undefined,
    inventoryRestoredAt: restoredInventory ? now : order.inventoryRestoredAt,
  });

  const payment = await getPaymentByOrder(orderId);
  if (payment?.paymentStatus === "paid") {
    await markPaymentStatus(orderId, "refunded", payment.method);
  }

  const delivery = await getDeliveryByOrderId(orderId);
  if (delivery && delivery.status === "assigned") {
    await updateDeliveryStatus(
      delivery.id,
      "delayed",
      delivery.currentLocation,
      delivery.estimatedDelivery,
    );
  }

  return updatedOrder;
}
