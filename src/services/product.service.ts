import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { createId } from "@/lib/utils";
import { Product, ProductFilterInput, ProductFormInput } from "@/types";

const COLLECTION = "products";

function getProductsCollection() {
  return collection(getFirebaseDb(), COLLECTION);
}

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
  const snapshot = await getDocs(query(getProductsCollection()));
  return snapshot.docs
    .map((documentSnapshot) =>
      normalizeProduct(documentSnapshot.id, documentSnapshot.data() as Record<string, unknown>),
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

  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTION, id));
  if (snapshot.exists()) {
    return normalizeProduct(snapshot.id, snapshot.data() as Record<string, unknown>);
  }

  return null;
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

  await setDoc(doc(getFirebaseDb(), COLLECTION, product.id), product);
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

  await updateDoc(doc(getFirebaseDb(), COLLECTION, productId), {
    name: updatedProduct.name,
    category: updatedProduct.category,
    description: updatedProduct.description,
    price: updatedProduct.price,
    stock: updatedProduct.stock,
    image64: updatedProduct.image64 ?? "",
    isActive: updatedProduct.isActive,
    updatedAt,
  });

  return updatedProduct;
}

export async function deleteProduct(productId: string) {
  const existingProduct = await getProductById(productId);
  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  await deleteDoc(doc(getFirebaseDb(), COLLECTION, productId));
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

  await updateDoc(doc(getFirebaseDb(), COLLECTION, productId), {
    averageRating,
    reviewCount,
    updatedAt: new Date().toISOString(),
  });

  return { averageRating, reviewCount };
}
