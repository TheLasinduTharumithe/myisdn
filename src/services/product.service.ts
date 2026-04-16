import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { readCollection, writeCollection } from "@/lib/local-db";
import { getFirebaseDb } from "@/lib/firebase";
import { createId } from "@/lib/utils";
import { canUseFirestore, getDocById, listDocs, setDocById } from "@/services/service-helpers";
import { Product, ProductFilterInput, ProductFormInput } from "@/types";

const COLLECTION = "products";

function sanitizeProductPayload(input: Partial<ProductFormInput>) {
  return {
    name: input.name?.trim() ?? "",
    category: input.category?.trim() ?? "",
    description: input.description?.trim() ?? "",
    price: Number(input.price ?? 0),
    stock: Number(input.stock ?? 0),
    image64: input.image64 ?? "",
    isActive: Boolean(input.isActive),
  };
}

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

function normalizeProduct(id: string, value: Record<string, unknown>) {
  return {
    id: typeof value.id === "string" && value.id ? value.id : id,
    name: typeof value.name === "string" ? value.name : "Unnamed Product",
    category: typeof value.category === "string" ? value.category : "General",
    description: typeof value.description === "string" ? value.description : "",
    price: typeof value.price === "number" ? value.price : Number(value.price ?? 0),
    stock: typeof value.stock === "number" ? value.stock : Number(value.stock ?? 0),
    image64: typeof value.image64 === "string" ? value.image64 : "",
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : "",
    isActive: typeof value.isActive === "boolean" ? value.isActive : true,
    averageRating:
      typeof value.averageRating === "number"
        ? value.averageRating
        : Math.max(0, Number(value.averageRating ?? 0) || 0),
    reviewCount:
      typeof value.reviewCount === "number"
        ? value.reviewCount
        : Math.max(0, Number(value.reviewCount ?? 0) || 0),
    createdAt: normalizeDate(value.createdAt),
    updatedAt: normalizeDate(value.updatedAt),
  } satisfies Product;
}

export async function getAllProducts() {
  let products = canUseFirestore()
    ? await listDocs<Record<string, unknown>>(COLLECTION)
    : readCollection<Record<string, unknown>[]>("products");

  if (products.length === 0) {
    products = readCollection<Record<string, unknown>[]>("products");
  }

  return products
    .map((product) =>
      normalizeProduct(
        typeof product.id === "string" && product.id ? product.id : createId("prod"),
        product,
      ),
    )
    .sort(
      (left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""),
    );
}

export async function getProducts(filters: ProductFilterInput = {}) {
  const products = await getAllProducts();

  return products.filter((product) => {
    if (!filters.showInactive && !product.isActive) {
      return false;
    }

    if (
      filters.search &&
      !`${product.name} ${product.description}`.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    if (filters.category && filters.category !== "All" && product.category !== filters.category) {
      return false;
    }

    return true;
  });
}

export async function getProductById(id: string) {
  if (!id) {
    return null;
  }

  const firestoreProduct = canUseFirestore()
    ? await getDocById<Record<string, unknown>>(COLLECTION, id)
    : null;
  if (firestoreProduct) {
    return normalizeProduct(id, firestoreProduct);
  }

  const localProduct = readCollection<Record<string, unknown>[]>("products").find((product) => product.id === id);
  return localProduct ? normalizeProduct(id, localProduct) : null;
}

export async function getProductCategories() {
  const products = await getAllProducts();
  return ["All", ...new Set(products.map((product) => product.category).filter(Boolean))];
}

export async function addProduct(input: ProductFormInput) {
  const now = new Date().toISOString();
  const payload = sanitizeProductPayload(input);
  const product: Product = {
    id: createId("prod"),
    ...payload,
    averageRating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const products = readCollection<Product[]>("products");
  writeCollection("products", [product, ...products]);

  if (canUseFirestore()) {
    await setDocById(COLLECTION, product);
  }

  return product;
}

export async function updateProduct(productId: string, input: ProductFormInput) {
  const existingProduct = await getProductById(productId);
  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  const updatedAt = new Date().toISOString();
  const payload = sanitizeProductPayload(input);
  const updatedProduct: Product = {
    ...existingProduct,
    ...payload,
    updatedAt,
  };

  const products = await getAllProducts();
  writeCollection(
    "products",
    products.map((product) => (product.id === productId ? updatedProduct : product)),
  );

  if (canUseFirestore()) {
    await setDocById(COLLECTION, updatedProduct);
  }

  return updatedProduct;
}

export async function deleteProduct(productId: string) {
  const existingProduct = await getProductById(productId);
  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  writeCollection(
    "products",
    readCollection<Product[]>("products").filter((product) => product.id !== productId),
  );

  if (canUseFirestore()) {
    try {
      await deleteDoc(doc(getFirebaseDb(), COLLECTION, productId));
    } catch (error) {
      console.warn(`Firestore delete failed for ${COLLECTION}/${productId}`, error);
    }
  }

  return existingProduct;
}

export async function saveProduct(input: Omit<Product, "id"> & { id?: string }) {
  if (input.id) {
    return updateProduct(input.id, {
      id: input.id,
      name: input.name,
      category: input.category,
      description: input.description,
      price: input.price,
      stock: input.stock,
      image64: input.image64 ?? "",
      isActive: input.isActive,
    });
  }

  return addProduct({
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price,
    stock: input.stock,
    image64: input.image64 ?? "",
    isActive: input.isActive,
  });
}

export async function updateProductStock(productId: string, stock: number) {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error("Product not found.");
  }

  return updateProduct(productId, {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    stock,
    image64: product.image64 ?? "",
    isActive: product.isActive,
  });
}

export async function updateProductReviewSummary(productId: string) {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), "reviews"), where("productId", "==", productId)));
  const ratings = snapshot.docs
    .map((documentSnapshot) => Number((documentSnapshot.data() as Record<string, unknown>).rating ?? 0))
    .filter((rating) => Number.isFinite(rating) && rating > 0);

  const reviewCount = ratings.length;
  const averageRating =
    reviewCount === 0 ? 0 : Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / reviewCount) * 10) / 10;

  const existingProduct = await getProductById(productId);
  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  const updatedProduct: Product = {
    ...existingProduct,
    averageRating,
    reviewCount,
    updatedAt: new Date().toISOString(),
  };

  writeCollection(
    "products",
    readCollection<Product[]>("products").map((product) => (product.id === productId ? updatedProduct : product)),
  );

  if (canUseFirestore()) {
    await setDocById(COLLECTION, updatedProduct);
  }

  return { averageRating, reviewCount };
}
