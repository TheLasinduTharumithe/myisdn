import { readCollection, writeCollection } from "@/lib/local-db";
import { getRdcRouteLocation } from "@/lib/osrm";
import { createId } from "@/lib/utils";
import { getAllUsers } from "@/services/user.service";
import { canUseFirestore, listDocs, setDocById } from "@/services/service-helpers";
import { Delivery, DeliveryStatus, GeoPointLike, Order, RdcId } from "@/types";

const COLLECTION = "deliveries";

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

function normalizeCoordinate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeLocation(
  value: unknown,
  fallback?: GeoPointLike,
) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const lat = normalizeCoordinate(record.lat);
  const lng = normalizeCoordinate(record.lng);

  if (lat === null || lng === null) {
    return fallback;
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return fallback;
  }

  return { lat, lng } satisfies GeoPointLike;
}

function normalizeDeliveryStatus(value: unknown): DeliveryStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  switch (normalized) {
    case "assigned":
      return "assigned";
    case "picked_up":
    case "picked up":
      return "picked_up";
    case "in_transit":
    case "in transit":
    case "on_route":
      return "in_transit";
    case "nearby":
      return "nearby";
    case "delivered":
    case "completed":
      return "delivered";
    case "delayed":
      return "delayed";
    default:
      return "assigned";
  }
}

function normalizeRdcId(value: unknown): RdcId | undefined {
  return value === "north" ||
    value === "south" ||
    value === "east" ||
    value === "west" ||
    value === "central"
    ? value
    : undefined;
}

function normalizeDelivery(value: Record<string, unknown>) {
  const rdcFallback =
    value.rdcId === "north" ||
    value.rdcId === "south" ||
    value.rdcId === "east" ||
    value.rdcId === "west" ||
    value.rdcId === "central"
      ? getRdcRouteLocation(value.rdcId)
      : undefined;

  const currentLocation =
    normalizeLocation(value.currentLocation, rdcFallback ?? { lat: 6.9271, lng: 79.8612 }) ??
    { lat: 6.9271, lng: 79.8612 };

  return {
    id:
      typeof value.id === "string" && value.id
        ? value.id
        : createId("delivery"),
    orderId: typeof value.orderId === "string" ? value.orderId : "",
    customerId: typeof value.customerId === "string" ? value.customerId : "",
    rdcId: normalizeRdcId(value.rdcId),
    driverId:
      typeof value.driverId === "string" && value.driverId
        ? value.driverId
        : "unassigned_driver",
    status: normalizeDeliveryStatus(value.status),
    customerLocation: normalizeLocation(value.customerLocation),
    currentLocation,
    customerAddress:
      typeof value.customerAddress === "string"
        ? value.customerAddress
        : typeof value.deliveryAddress === "string"
          ? value.deliveryAddress
          : "",
    estimatedDelivery:
      normalizeDate(value.estimatedDelivery) ||
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: normalizeDate(value.updatedAt) || new Date().toISOString(),
  } satisfies Delivery;
}

async function persistDeliveries(nextDeliveries: Delivery[]) {
  writeCollection("deliveries", nextDeliveries);

  if (canUseFirestore()) {
    await Promise.all(nextDeliveries.map((delivery) => setDocById(COLLECTION, delivery)));
  }
}

export async function getDeliveries() {
  let deliveries = canUseFirestore()
    ? await listDocs<Record<string, unknown>>(COLLECTION)
    : readCollection<Record<string, unknown>[]>("deliveries");

  if (deliveries.length === 0) {
    deliveries = readCollection<Record<string, unknown>[]>("deliveries");
  }

  return deliveries
    .map((delivery) => normalizeDelivery(delivery))
    .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt));
}

export async function getDeliveryById(id: string) {
  const deliveries = await getDeliveries();
  return deliveries.find((delivery) => delivery.id === id) ?? null;
}

export async function getDeliveryByOrderId(orderId: string) {
  const deliveries = await getDeliveries();
  return deliveries.find((delivery) => delivery.orderId === orderId) ?? null;
}

export async function createDelivery(order: Order) {
  const existing = await getDeliveryByOrderId(order.id);
  if (existing) {
    return existing;
  }

  const startLocation = getRdcRouteLocation(order.rdcId) ?? { lat: 6.9271, lng: 79.8612 };
  const delivery: Delivery = {
    id: createId("delivery"),
    orderId: order.id,
    customerId: order.customerId,
    rdcId: order.rdcId,
    driverId: "unassigned_driver",
    status: "assigned",
    customerLocation: order.deliveryLocation,
    currentLocation: startLocation,
    customerAddress: order.deliveryAddress,
    estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (canUseFirestore()) {
    await setDocById(COLLECTION, delivery);
  }

  const deliveries = readCollection<Delivery[]>("deliveries");
  writeCollection("deliveries", [delivery, ...deliveries]);
  return delivery;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  currentLocation?: GeoPointLike,
  estimatedDelivery?: string,
) {
  const deliveries = await getDeliveries();
  const target = deliveries.find((delivery) => delivery.id === deliveryId);

  if (!target) {
    throw new Error("Delivery record not found.");
  }

  const updated: Delivery = {
    ...target,
    status,
    currentLocation: currentLocation ?? target.currentLocation,
    estimatedDelivery: estimatedDelivery ?? target.estimatedDelivery,
    updatedAt: new Date().toISOString(),
  };

  if (canUseFirestore()) {
    await setDocById(COLLECTION, updated);
  }

  writeCollection(
    "deliveries",
    deliveries.map((delivery) => (delivery.id === deliveryId ? updated : delivery)),
  );

  return updated;
}

export async function assignDeliveriesToDriver(driverId: string, deliveryIds: string[]) {
  const uniqueIds = [...new Set(deliveryIds.filter(Boolean))];
  if (!driverId || uniqueIds.length === 0) {
    return [] as Delivery[];
  }

  const deliveries = await getDeliveries();
  const updatedDeliveries = deliveries.map((delivery) =>
    uniqueIds.includes(delivery.id)
      ? {
          ...delivery,
          driverId,
          updatedAt: new Date().toISOString(),
        }
      : delivery,
  );

  await persistDeliveries(updatedDeliveries);
  return updatedDeliveries.filter((delivery) => uniqueIds.includes(delivery.id));
}

export async function getDeliveriesForDriver(driverId: string) {
  const deliveries = await getDeliveries();
  const exactMatches = deliveries.filter((delivery) => delivery.driverId === driverId);

  const users = await getAllUsers();
  const usersById = new Map(users.map((user) => [user.id, user]));
  const currentDriver = usersById.get(driverId);
  const logisticsIds = new Set(users.filter((user) => user.role === "logistics").map((user) => user.id));
  const fallbackDeliveries = deliveries.filter(
    (delivery) => {
      if (delivery.driverId === driverId) {
        return false;
      }

      const assignedDriver = delivery.driverId ? usersById.get(delivery.driverId) : undefined;
      const isClaimableByRdc =
        delivery.status === "assigned" &&
        Boolean(currentDriver?.rdcId) &&
        Boolean(delivery.rdcId) &&
        delivery.rdcId === currentDriver?.rdcId &&
        (!assignedDriver || assignedDriver.role !== "logistics" || assignedDriver.rdcId !== currentDriver?.rdcId);

      return (
        delivery.driverId === "unassigned_driver" ||
        !delivery.driverId ||
        !logisticsIds.has(delivery.driverId) ||
        isClaimableByRdc
      );
    },
  );

  if (fallbackDeliveries.length > 0) {
    await assignDeliveriesToDriver(
      driverId,
      fallbackDeliveries.map((delivery) => delivery.id),
    );
    return [...exactMatches, ...fallbackDeliveries.map((delivery) => ({
      ...delivery,
      driverId,
      updatedAt: new Date().toISOString(),
    }))];
  }

  if (logisticsIds.size <= 1) {
    const claimableDeliveries = deliveries.filter((delivery) => delivery.driverId !== driverId);

    if (claimableDeliveries.length > 0) {
      await assignDeliveriesToDriver(
        driverId,
        claimableDeliveries.map((delivery) => delivery.id),
      );
    }

    return deliveries.map((delivery) => ({
      ...delivery,
      driverId,
      updatedAt: new Date().toISOString(),
    }));
  }

  return exactMatches;
}
