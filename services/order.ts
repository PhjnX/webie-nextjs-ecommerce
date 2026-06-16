export interface CustomerOrderItem {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  productSku: string | null;
  quantity: number;
  subtotal: number;
}

export interface CustomerOrder {
  id: number;
  items: CustomerOrderItem[];
  status: string;
  totalAmount: number;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  customerPhone: string;
  note: string;
  vnpayTxnRef: string | null;
  createdAt: string;
  updatedAt: string;
  raw?: Record<string, unknown>;
}

interface ApiResponse<TData = unknown> {
  success?: boolean;
  message?: string;
  data?: TData;
  orders?: TData;
  paymentUrl?: string;
  url?: string;
}

export class OrderApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OrderApiError";
    this.status = status;
  }
}

const FALLBACK_PRODUCT_IMAGE = "/images/services/website-templates.png";
const DEFAULT_CHECKOUT_NOTE = "Checkout from profile card.";

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
      const numericValue = Number(value.replace(/[^\d.-]/g, ""));

      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
  }

  return 0;
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_") || "pending";
}

function extractCollection(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  const candidates = [
    value.data,
    value.orders,
    value.items,
    value.results,
  ];

  for (const candidate of candidates) {
    const items = extractCollection(candidate);

    if (items.length > 0) {
      return items;
    }
  }

  return [];
}

function findRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return {};
}

function normalizeOrderItem(
  value: unknown,
  index: number,
): CustomerOrderItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const productId = readNumber(value, ["productId", "product_id"]);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  const quantity = readNumber(value, ["quantity", "qty"]) || 1;
  const productPrice = readNumber(value, [
    "productPrice",
    "product_price",
    "price",
  ]);

  return {
    id: readNumber(value, ["id", "itemId", "item_id"]) || index + 1,
    productId,
    productName:
      readString(value, ["productName", "product_name", "name"]) ||
      `Product #${productId}`,
    productPrice,
    productImageUrl:
      readString(value, [
        "productImageUrl",
        "product_image_url",
        "imageUrl",
        "image_url",
      ]) || FALLBACK_PRODUCT_IMAGE,
    productSku: readString(value, ["productSku", "product_sku", "sku"]) || null,
    quantity,
    subtotal:
      readNumber(value, ["subtotal", "subTotal", "total", "totalPrice"]) ||
      productPrice * quantity,
  };
}

function normalizeOrder(value: unknown): CustomerOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readNumber(value, ["id", "orderId", "order_id"]);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const items = extractCollection(value.items)
    .map(normalizeOrderItem)
    .filter((item): item is CustomerOrderItem => Boolean(item));
  const customer = findRecord(value, ["customer", "user", "account", "partner"]);
  const addressRecord = findRecord(value, [
    "shipping",
    "shippingAddress",
    "shipping_address",
    "delivery",
    "deliveryAddress",
    "delivery_address",
    "billing",
    "billingAddress",
    "billing_address",
  ]);

  return {
    id,
    items,
    status: normalizeStatus(readString(value, ["status", "orderStatus"])),
    totalAmount: readNumber(value, ["totalAmount", "total_amount", "total"]),
    customerName: readString(value, ["customerName", "customer_name", "name"]),
    customerEmail: readString(value, [
      "customerEmail",
      "customer_email",
      "email",
    ]),
    customerPhone: readString(value, [
      "customerPhone",
      "customer_phone",
      "phone",
    ]),
    customerAddress: readString(value, [
      "address",
      "customer_address",
      "customerAddress",
      "streetAddress",
      "street_address",
      "shippingAddress",
      "shipping_address",
      "deliveryAddress",
      "delivery_address",
      "billingAddress",
      "billing_address",
    ]) ||
      readString(customer, [
        "address",
        "customer_address",
        "customerAddress",
        "streetAddress",
        "street_address",
      ]) ||
      readString(addressRecord, [
        "address",
        "street",
        "streetAddress",
        "street_address",
        "fullAddress",
        "full_address",
      ]),
    note: readString(value, ["note", "notes", "description"]),
    vnpayTxnRef: readString(value, ["vnpayTxnRef", "vnpay_txn_ref"]) || null,
    createdAt: readString(value, ["created_at", "createdAt", "createdDate"]),
    updatedAt: readString(value, ["updated_at", "updatedAt", "updatedDate"]),
    raw: value,
  };
}

function extractOrder(value: unknown): CustomerOrder | null {
  if (Array.isArray(value)) {
    return (
      value
        .map(normalizeOrder)
        .find((order): order is CustomerOrder => Boolean(order)) ?? null
    );
  }

  const directOrder = normalizeOrder(value);

  if (directOrder) {
    return directOrder;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of ["data", "order", "checkout", "result", "payload"]) {
    const nestedOrder = extractOrder(value[key]);

    if (nestedOrder) {
      return nestedOrder;
    }
  }

  return null;
}

function getMostRecentOrder(orders: CustomerOrder[]) {
  return (
    [...orders].sort((firstOrder, secondOrder) => {
      const firstDate = new Date(firstOrder.createdAt).getTime();
      const secondDate = new Date(secondOrder.createdAt).getTime();

      if (Number.isFinite(firstDate) && Number.isFinite(secondDate)) {
        return secondDate - firstDate;
      }

      return secondOrder.id - firstOrder.id;
    })[0] ?? null
  );
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
      // Fall through to the diagnostic response below.
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
    message: `Order API returned ${response.status} ${response.statusText}.${responsePreview}`,
  };
}

function extractPaymentUrl(value: unknown): string {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return "";
  }

  const directUrl = readString(value, [
    "paymentUrl",
    "payment_url",
    "redirectUrl",
    "redirect_url",
    "checkoutUrl",
    "checkout_url",
    "vnpayUrl",
    "vnpay_url",
    "url",
  ]);

  if (directUrl && /^https?:\/\//i.test(directUrl)) {
    return directUrl;
  }

  return extractPaymentUrl(value.data);
}

async function sendOrderRequest<TData>(
  path: string,
  options: RequestInit = { method: "GET" },
) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await readApiResponse<TData>(response);

  if (!response.ok || payload.success === false) {
    throw new OrderApiError(
      payload.message || "Order request failed.",
      response.status,
    );
  }

  return {
    message: payload.message || "Request completed successfully.",
    data: payload.data ?? payload.orders ?? payload,
  };
}

export function formatOrderDate(value: string | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export function formatOrderCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getOrderStatusLabel(status: string) {
  return (
    status
      .split(/[_-]+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ") || "Pending"
  );
}

export async function getCustomerOrders() {
  const response = await sendOrderRequest<unknown>("/api/order");

  return extractCollection(response.data)
    .map(normalizeOrder)
    .filter((order): order is CustomerOrder => Boolean(order));
}

export async function getCustomerOrder(orderId: number | string) {
  const numericOrderId = Number(orderId);

  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
    throw new OrderApiError("Order ID is required.", 400);
  }

  const orders = await getCustomerOrders();

  return orders.find((order) => order.id === numericOrderId) ?? null;
}

export async function checkoutOrder(note = DEFAULT_CHECKOUT_NOTE) {
  const checkoutNote = note.trim() || DEFAULT_CHECKOUT_NOTE;
  const response = await sendOrderRequest<unknown>("/api/order/checkout", {
    method: "POST",
    body: JSON.stringify({ note: checkoutNote }),
  });
  const order = extractOrder(response.data);

  if (order) {
    return {
      message: response.message,
      order,
      raw: response.data,
    };
  }

  const refreshedOrders = await getCustomerOrders().catch(() => []);

  return {
    message: response.message,
    order: getMostRecentOrder(refreshedOrders),
    raw: response.data,
  };
}

export async function cancelCustomerOrder(orderId: number) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new OrderApiError("Order ID is required.", 400);
  }

  const response = await sendOrderRequest<unknown>(
    `/api/order/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "PATCH",
    },
  );

  return {
    message: response.message,
    order: extractOrder(response.data),
    raw: response.data,
  };
}

export async function createVnpayPayment(orderId: number) {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new OrderApiError("Order ID is required.", 400);
  }

  const response = await sendOrderRequest<unknown>("/api/payment/vnpay", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });

  return {
    message: response.message,
    paymentUrl: extractPaymentUrl(response.data),
    raw: response.data,
  };
}
