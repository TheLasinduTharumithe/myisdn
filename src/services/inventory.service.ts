import { readCollection, writeCollection } from "@/lib/local-db";
import { createId } from "@/lib/utils";
import { getProductById, getProducts, updateProductStock } from "@/services/product.service";
import { canUseFirestore, listDocs, setDocById } from "@/services/service-helpers";
import { Inventory, OrderItem, Product, RdcId, StockTransfer } from "@/types";

const COLLECTION = "inventory";

interface InventoryReductionSnapshot {
  previousInventory: Inventory[];
  previousProducts: Product[];
}

function normalizeText(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function resolveProductForOrderItem(item: OrderItem, products: Product[]) {
  if (item.productId) {
    const byId = products.find((product) => product.id === item.productId);
    if (byId) {
      return byId;
    }
  }

  const itemName = normalizeText(item.productName);
  if (!itemName) {
    return null;
  }

  return (
    products.find((product) => normalizeText(product.name) === itemName) ??
    products.find((product) => {
      const productName = normalizeText(product.name);
      return productName.includes(itemName) || itemName.includes(productName);
    }) ??
    null
  );
}

async function resolveOrderItemsForInventory(items: OrderItem[]) {
  const products = await getProducts({ showInactive: true });

  return items.map((item) => {
    const product = resolveProductForOrderItem(item, products);

    return {
      ...item,
      productId: product?.id ?? item.productId,
      productName: item.productName ?? product?.name ?? item.productId,
    };
  });
}

export async function validateInventoryForOrder(rdcId: RdcId, items: OrderItem[]) {
  const inventory = await getInventory(rdcId);
  const resolvedItems = await resolveOrderItemsForInventory(items);

  for (const item of resolvedItems) {
    const stock = inventory.find((record) => record.productId === item.productId);
    if (!item.productId) {
      throw new Error(`Unable to match product ${item.productName ?? "item"} to current inventory.`);
    }
    if (!stock) {
      throw new Error(`No inventory record found for product ${item.productName ?? item.productId} in this RDC.`);
    }
    if (stock.quantity < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productName ?? item.productId}.`);
    }
  }

  return resolvedItems;
}

export async function restoreInventoryReduction(snapshot: InventoryReductionSnapshot) {
  if (snapshot.previousInventory.length > 0) {
    const inventory = await getInventory();
    const restoredInventory = inventory.map((record) => {
      const previous = snapshot.previousInventory.find((item) => item.id === record.id);
      return previous ?? record;
    });

    writeCollection("inventory", restoredInventory);

    if (canUseFirestore()) {
      await Promise.all(snapshot.previousInventory.map((record) => setDocById(COLLECTION, record)));
    }
  }

  await Promise.all(
    snapshot.previousProducts.map((product) => updateProductStock(product.id, product.stock)),
  );
}

export async function getInventory(rdcId?: RdcId) {
  let items = canUseFirestore()
    ? await listDocs<Inventory>(COLLECTION)
    : readCollection<Inventory[]>("inventory");

  if (items.length === 0) {
    items = readCollection<Inventory[]>("inventory");
  }

  return rdcId ? items.filter((item) => item.rdcId === rdcId) : items;
}

export async function updateInventoryQuantity(inventoryId: string, quantity: number) {
  const inventory = await getInventory();
  const target = inventory.find((item) => item.id === inventoryId);
  if (!target) {
    throw new Error("Inventory record not found.");
  }

  const updated: Inventory = {
    ...target,
    quantity,
    updatedAt: new Date().toISOString(),
  };

  const nextInventory = inventory.map((item) => (item.id === inventoryId ? updated : item));
  writeCollection("inventory", nextInventory);

  if (canUseFirestore()) {
    await setDocById(COLLECTION, updated);
  }

  return updated;
}

export async function reduceInventoryForOrder(rdcId: RdcId, items: OrderItem[]) {
  const fullInventory = await getInventory();
  const products = await getProducts({ showInactive: true });
  const resolvedItems = await validateInventoryForOrder(rdcId, items);
  const affectedProductIds = [...new Set(resolvedItems.map((item) => item.productId).filter(Boolean))];
  const previousInventory = fullInventory.filter(
    (record) => record.rdcId === rdcId && affectedProductIds.includes(record.productId),
  );
  const previousProducts = products.filter((product) => affectedProductIds.includes(product.id));
  const snapshot = {
    previousInventory,
    previousProducts,
  } satisfies InventoryReductionSnapshot;

  try {
    const updatedInventory = fullInventory.map((record) => {
      const match = resolvedItems.find(
        (item) => item.productId === record.productId && record.rdcId === rdcId,
      );
      if (!match) {
        return record;
      }

      return {
        ...record,
        quantity: record.quantity - match.quantity,
        updatedAt: new Date().toISOString(),
      };
    });

    writeCollection("inventory", updatedInventory);

    if (canUseFirestore()) {
      await Promise.all(
        updatedInventory
          .filter((record) => record.rdcId === rdcId && resolvedItems.some((item) => item.productId === record.productId))
          .map((record) => setDocById(COLLECTION, record)),
      );
    }

    await Promise.all(
      resolvedItems.map(async (item) => {
        const product = item.productId ? await getProductById(item.productId) : null;
        if (product) {
          await updateProductStock(product.id, Math.max(product.stock - item.quantity, 0));
        }
      }),
    );

    return snapshot;
  } catch (error) {
    await restoreInventoryReduction(snapshot);
    throw error;
  }
}

export async function transferStock(productId: string, fromRdcId: RdcId, toRdcId: RdcId, quantity: number) {
  if (quantity <= 0) {
    throw new Error("Transfer quantity must be greater than zero.");
  }

  const inventory = await getInventory();
  const fromStock = inventory.find((item) => item.productId === productId && item.rdcId === fromRdcId);
  const toStock = inventory.find((item) => item.productId === productId && item.rdcId === toRdcId);

  if (!fromStock || !toStock) {
    throw new Error("Transfer record could not be created.");
  }

  if (fromStock.quantity < quantity) {
    throw new Error("Source RDC does not have enough stock.");
  }

  const now = new Date().toISOString();
  const nextInventory = inventory.map((item) => {
    if (item.id === fromStock.id) {
      return { ...item, quantity: item.quantity - quantity, updatedAt: now };
    }

    if (item.id === toStock.id) {
      return { ...item, quantity: item.quantity + quantity, updatedAt: now };
    }

    return item;
  });

  writeCollection("inventory", nextInventory);

  if (canUseFirestore()) {
    await Promise.all(
      nextInventory
        .filter((item) => item.id === fromStock.id || item.id === toStock.id)
        .map((item) => setDocById(COLLECTION, item)),
    );
  }

  const transfers = readCollection<StockTransfer[]>("transfers");
  const transfer: StockTransfer = {
    id: createId("transfer"),
    productId,
    fromRdcId,
    toRdcId,
    quantity,
    status: "completed",
    createdAt: now,
  };
  writeCollection("transfers", [transfer, ...transfers]);
  return transfer;
}

export async function getTransfers() {
  return readCollection<StockTransfer[]>("transfers");
}

export async function getLowStockInventory(threshold = 20) {
  const inventory = await getInventory();
  return inventory.filter((item) => item.quantity <= threshold);
}

export async function ensureInventoryRecord(productId: string, rdcId: RdcId) {
  const inventory = await getInventory();
  const existing = inventory.find((item) => item.productId === productId && item.rdcId === rdcId);
  if (existing) {
    return existing;
  }

  const created: Inventory = {
    id: createId("inv"),
    productId,
    rdcId,
    quantity: 0,
    updatedAt: new Date().toISOString(),
  };
  const nextInventory = [created, ...inventory];
  writeCollection("inventory", nextInventory);

  if (canUseFirestore()) {
    await setDocById(COLLECTION, created);
  }

  return created;
}
