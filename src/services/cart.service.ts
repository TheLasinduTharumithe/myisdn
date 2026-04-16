import { readCollection, writeCollection } from "@/lib/local-db";
import { getProductById } from "@/services/product.service";
import { CartItem } from "@/types";

async function normalizeCartItems(cart: CartItem[]) {
  const normalizedItems = await Promise.all(
    cart.map(async (item) => {
      const product = item.product ?? (await getProductById(item.productId));
      if (!product || !product.isActive) {
        return null;
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        product,
      } satisfies CartItem;
    }),
  );

  return normalizedItems.filter((item): item is CartItem => Boolean(item));
}

export async function getCart() {
  const cart = readCollection<CartItem[]>("cart");
  const normalizedCart = await normalizeCartItems(cart);

  if (normalizedCart.length !== cart.length || normalizedCart.some((item, index) => item.product !== cart[index]?.product)) {
    writeCollection("cart", normalizedCart);
  }

  return normalizedCart;
}

export async function addToCart(productId: string, quantity = 1) {
  const product = await getProductById(productId);
  if (!product || !product.isActive) {
    throw new Error("This product is currently unavailable.");
  }

  const cart = await getCart();
  const existing = cart.find((item) => item.productId === productId);
  const requestedQuantity = (existing?.quantity ?? 0) + quantity;

  if (requestedQuantity > product.stock) {
    throw new Error("Requested quantity exceeds available stock.");
  }

  const nextCart = existing
    ? cart.map((item) =>
        item.productId === productId ? { ...item, quantity: requestedQuantity, product } : item,
      )
    : [...cart, { productId, quantity, product }];

  writeCollection("cart", nextCart);
  return nextCart;
}

export async function updateCartQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new Error("Product not found.");
  }

  if (quantity > product.stock) {
    throw new Error("Requested quantity exceeds available stock.");
  }

  const cart = await getCart();
  const nextCart = cart.map((item) =>
    item.productId === productId ? { ...item, quantity, product } : item,
  );
  writeCollection("cart", nextCart);
  return nextCart;
}

export async function removeFromCart(productId: string) {
  const cart = await getCart();
  const nextCart = cart.filter((item) => item.productId !== productId);
  writeCollection("cart", nextCart);
  return nextCart;
}

export async function clearCart() {
  writeCollection("cart", []);
}

export async function getCartTotals() {
  const cart = await getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return {
    items: cart,
    subtotal,
    itemCount,
  };
}
