export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productPrice: string;
  productImageUrl: string;
  productSku: string | null;
  quantity: number;
}

export interface CartMutationResult {
  message: string;
  items: CartItem[];
}

interface ApiResponse<TData = unknown> {
  success?: boolean;
  message?: string;
  data?: TData;
}

export class CartApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CartApiError";
    this.status = status;
  }
}

export const CART_UPDATED_EVENT = "webie_cart_updated";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "https://coral-mouse-470858.hostingersite.com";

const FALLBACK_PRODUCT_IMAGE = "/images/services/website-templates.png";

const ADD_CART_PATCH_FALLBACK_STATUSES = new Set([400, 404, 409]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const numericValue = Number(value);

      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
  }

  return 0;
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function normalizeProductImageUrl(imageUrl: string) {
  const value = imageUrl.trim();

  if (!value) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  // Ảnh local trong thư mục public/images
  if (value.startsWith("/images/")) {
    return value;
  }

  // Ảnh backend dạng /odoo/products/38/image
  if (value.startsWith("/")) {
    return joinUrl(API_BASE_URL, value);
  }

  return joinUrl(API_BASE_URL, value);
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const productId = readNumber(value, ["productId", "product_id"]);
  const id = readNumber(value, ["id", "cartItemId", "cart_item_id"]);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  const quantity = readNumber(value, ["quantity", "qty"]);
  const productSku = readString(value, ["productSku", "product_sku", "sku"]);

  const rawProductImageUrl = readString(value, [
    "productImageUrl",
    "product_image_url",
    "imageUrl",
    "image_url",
    "image",
  ]);

  return {
    id: Number.isInteger(id) && id > 0 ? id : productId,
    productId,
    productName:
        readString(value, ["productName", "product_name", "name"]) ||
        `Product #${productId}`,
    productPrice: readString(value, [
      "productPrice",
      "product_price",
      "price",
      "listPrice",
      "list_price",
    ]),
    productImageUrl: normalizeProductImageUrl(
        rawProductImageUrl || `/odoo/products/${productId}/image`,
    ),
    productSku: productSku || null,
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
  };
}

function extractCartItems(value: unknown): CartItem[] {
  if (Array.isArray(value)) {
    return value
        .map(normalizeCartItem)
        .filter((item): item is CartItem => Boolean(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const candidates = [
    value.items,
    value.cartItems,
    value.cart_items,
    value.cart,
    value.data,
  ];

  for (const candidate of candidates) {
    const items = extractCartItems(candidate);

    if (items.length > 0) {
      return items;
    }
  }

  const item = normalizeCartItem(value);

  return item ? [item] : [];
}

async function readApiResponse<TData>(
    response: Response,
): Promise<ApiResponse<TData>> {
  const contentType = response.headers.get("content-type");
  const responseText = await response.text();

  if (contentType?.includes("application/json") && responseText.trim()) {
    try {
      return JSON.parse(responseText) as ApiResponse<TData>;
    } catch {
      // Fall through to diagnostic response below.
    }
  }

  if (response.ok) {
    return {
      success: true,
      message: "Request completed successfully.",
    };
  }

  const normalizedText = responseText.replace(/\s+/g, " ").trim();

  const responsePreview = normalizedText
      ? ` ${normalizedText.slice(0, 220)}`
      : "";

  return {
    success: false,
    message: `Cart API returned ${response.status} ${response.statusText}.${responsePreview}`,
  };
}

async function sendCartRequest<TData = unknown>(
    path: string,
    options: RequestInit = {},
) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await readApiResponse<TData>(response);

  if (!response.ok || payload.success === false) {
    throw new CartApiError(
        payload.message || "Cart request failed.",
        response.status,
    );
  }

  return {
    success: true,
    message: payload.message || "Request completed successfully.",
    data: payload.data,
  };
}

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

async function findCartItemIdByProductId(productId: number) {
  try {
    const items = await getCartItems();
    const existingItem = items.find((item) => item.productId === productId);

    return existingItem?.id ?? productId;
  } catch {
    return productId;
  }
}

export async function getCartItems() {
  const response = await sendCartRequest("/api/cart", {
    method: "GET",
  });

  return extractCartItems(response.data);
}

export async function addCartItem(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new CartApiError("Product ID is required.", 400);
  }

  let response: Awaited<ReturnType<typeof sendCartRequest>>;

  try {
    response = await sendCartRequest("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity: 1,
      }),
    });
  } catch (error) {
    if (
        error instanceof CartApiError &&
        ADD_CART_PATCH_FALLBACK_STATUSES.has(error.status)
    ) {
      const cartItemId = await findCartItemIdByProductId(productId);

      response = await sendCartRequest(`/api/cart/item/${cartItemId}`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
    } else {
      throw error;
    }
  }

  notifyCartUpdated();

  return {
    message: response.message,
    items: extractCartItems(response.data),
  };
}

export async function clearCart() {
  const response = await sendCartRequest("/api/cart", {
    method: "DELETE",
  });

  notifyCartUpdated();

  return response.message;
}

export async function deleteCartItem(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new CartApiError("Cart item ID is required.", 400);
  }

  const response = await sendCartRequest(
      `/api/cart/item?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
  );

  notifyCartUpdated();

  return {
    message: response.message,
    items: extractCartItems(response.data),
  };
}

export async function updateCartItemQuantity(id: number, quantity: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new CartApiError("Cart item ID is required.", 400);
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new CartApiError(
        "Quantity must be zero or a positive whole number.",
        400,
    );
  }

  if (quantity === 0) {
    return deleteCartItem(id);
  }

  const response = await sendCartRequest(`/api/cart/item/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      quantity,
    }),
  });

  notifyCartUpdated();

  return {
    message: response.message,
    items: extractCartItems(response.data),
  };
}