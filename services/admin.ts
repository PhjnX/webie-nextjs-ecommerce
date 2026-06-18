export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingOrders: number;
  paidOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  latestOrders: AdminOrder[];
  raw?: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  address?: string;
  raw?: Record<string, unknown>;
}

export interface UpdateAdminUserPayload {
  fullName: string;
  phone?: string;
  address?: string;
  role?: string;
}

export interface AdminOrderItem {
  id: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  orderStatus: string;
  createdAt: string;
  updatedAt?: string;
  items: AdminOrderItem[];
  raw?: Record<string, unknown>;
}

interface ApiResponse<TData = unknown> {
  success?: boolean;
  message?: string;
  data?: TData;
  users?: TData;
  user?: TData;
  orders?: TData;
  order?: TData;
  stats?: TData;
}

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

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

    if (typeof value === "boolean") {
      return value ? "true" : "false";
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
      const normalizedValue = value.replace(/[^\d.-]/g, "");
      const numericValue = Number(normalizedValue || value);

      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
  }

  return 0;
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const normalizedValue = value.trim().toLowerCase();

      if (["true", "1", "yes", "locked", "blocked", "disabled"].includes(normalizedValue)) {
        return true;
      }

      if (["false", "0", "no", "active", "enabled"].includes(normalizedValue)) {
        return false;
      }
    }
  }

  return null;
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

function unwrapRecord(value: unknown, keys: string[] = []) {
  if (!isRecord(value)) {
    return {};
  }

  for (const key of keys) {
    if (isRecord(value[key])) {
      return value[key] as Record<string, unknown>;
    }
  }

  const data = value.data;

  if (isRecord(data)) {
    return data;
  }

  return value;
}

function extractCollection(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }

    const nested = extractCollection(candidate, keys);

    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function getRecordId(record: Record<string, unknown>, keys: string[]) {
  const id = readString(record, keys);

  return id || "unknown";
}

function normalizeStatus(value: string, fallback = "unknown") {
  const status = value.trim().toLowerCase().replace(/\s+/g, "_");

  return status || fallback;
}

function normalizeAccountStatus(value: string, fallback = "active") {
  const status = normalizeStatus(value, fallback);

  if (status === "locked") {
    return "blocked";
  }

  return status;
}

function normalizeUser(value: unknown): AdminUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const record = unwrapRecord(value, ["user", "account", "customer"]);
  const id = getRecordId(record, ["id", "userId", "user_id", "uuid"]);

  if (!id || id === "unknown") {
    return null;
  }

  const locked = readBoolean(record, [
    "locked",
    "isLocked",
    "is_locked",
    "blocked",
    "isBlocked",
    "is_blocked",
    "disabled",
  ]);
  const status = locked === true
    ? "blocked"
    : normalizeAccountStatus(
        readString(record, [
          "status",
          "accountStatus",
          "account_status",
          "state",
        ]),
        locked === false ? "active" : "active",
      );

  return {
    id,
    name:
      readString(record, [
        "name",
        "fullName",
        "full_name",
        "displayName",
        "display_name",
        "username",
      ]) || "Unnamed user",
    email: readString(record, ["email", "emailAddress", "email_address"]),
    phone: readString(record, ["phone", "phoneNumber", "phone_number"]),
    role: normalizeStatus(
      readString(record, ["role", "userRole", "user_role", "type"]),
      "user",
    ),
    status,
    createdAt: readString(record, [
      "createdAt",
      "created_at",
      "createdDate",
      "created_date",
      "createDate",
      "create_date",
    ]),
    updatedAt: readString(record, [
      "updatedAt",
      "updated_at",
      "updatedDate",
      "updated_date",
      "writeDate",
      "write_date",
    ]),
    address: readString(record, ["address", "streetAddress", "street_address"]),
    raw: record,
  };
}

function normalizeOrderItem(value: unknown, index: number): AdminOrderItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const product = findRecord(value, ["product", "service", "item"]);
  const quantity = readNumber(value, ["quantity", "qty", "product_uom_qty"]) || 1;
  const unitPrice =
    readNumber(value, ["unitPrice", "unit_price", "price", "priceUnit", "price_unit"]) ||
    readNumber(product, ["price", "list_price"]);
  const totalPrice =
    readNumber(value, ["totalPrice", "total_price", "subtotal", "amount"]) ||
    unitPrice * quantity;

  return {
    id:
      readString(value, ["id", "lineId", "line_id"]) ||
      readString(product, ["id", "productId", "product_id"]) ||
      String(index + 1),
    productId: readString(product, ["id", "productId", "product_id"]) || undefined,
    productName:
      readString(value, ["productName", "product_name", "name"]) ||
      readString(product, ["name", "productName", "product_name"]) ||
      `Item ${index + 1}`,
    sku: readString(value, ["sku", "productSku", "product_sku"]) || readString(product, ["sku"]) || undefined,
    quantity,
    unitPrice,
    totalPrice,
    imageUrl:
      readString(value, [
        "imageUrl",
        "image_url",
        "productImageUrl",
        "product_image_url",
      ]) ||
      readString(product, ["image", "imageUrl", "image_url"]) ||
      undefined,
  };
}

function normalizeOrder(value: unknown): AdminOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const record = unwrapRecord(value, ["order"]);
  const customer = findRecord(record, ["customer", "user", "account", "partner"]);
  const payment = findRecord(record, ["payment", "transaction"]);
  const id = getRecordId(record, [
    "id",
    "orderId",
    "order_id",
    "orderNumber",
    "order_number",
    "name",
  ]);

  if (!id || id === "unknown") {
    return null;
  }

  const items = extractCollection(record, [
    "items",
    "orderItems",
    "order_items",
    "products",
    "lines",
    "orderLines",
    "order_lines",
  ])
    .map(normalizeOrderItem)
    .filter((item): item is AdminOrderItem => Boolean(item));

  return {
    id,
    customerName:
      readString(record, ["customerName", "customer_name", "buyerName", "buyer_name"]) ||
      readString(customer, ["name", "fullName", "full_name", "displayName", "display_name"]) ||
      "Unknown customer",
    customerEmail:
      readString(record, ["customerEmail", "customer_email", "email"]) ||
      readString(customer, ["email", "emailAddress", "email_address"]),
    customerPhone:
      readString(record, ["customerPhone", "customer_phone", "phone"]) ||
      readString(customer, ["phone", "phoneNumber", "phone_number"]) ||
      undefined,
    customerAddress:
      readString(record, ["customerAddress", "customer_address", "address"]) ||
      readString(customer, ["address", "streetAddress", "street_address"]) ||
      undefined,
    totalAmount: readNumber(record, [
      "totalAmount",
      "total_amount",
      "amountTotal",
      "amount_total",
      "grandTotal",
      "grand_total",
      "total",
      "amount",
    ]),
    paymentStatus: normalizeStatus(
      readString(record, ["paymentStatus", "payment_status"]) ||
        readString(payment, ["status", "state"]),
      "unknown",
    ),
    paymentMethod:
      readString(record, ["paymentMethod", "payment_method"]) ||
      readString(payment, ["method", "provider", "paymentMethod", "payment_method"]) ||
      undefined,
    orderStatus: normalizeStatus(
      readString(record, ["orderStatus", "order_status", "status", "state"]),
      "pending",
    ),
    createdAt: readString(record, [
      "createdAt",
      "created_at",
      "createdDate",
      "created_date",
      "dateOrder",
      "date_order",
    ]),
    updatedAt: readString(record, [
      "updatedAt",
      "updated_at",
      "updatedDate",
      "updated_date",
      "writeDate",
      "write_date",
    ]),
    items,
    raw: record,
  };
}

async function readApiResponse<TData>(
  response: Response,
): Promise<ApiResponse<TData>> {
  const responseText = await response.text();

  if (responseText.trim()) {
    try {
      return JSON.parse(responseText) as ApiResponse<TData>;
    } catch {
      return {
        success: response.ok,
        message: responseText.replace(/\s+/g, " ").trim(),
      };
    }
  }

  return {
    success: response.ok,
    message: response.ok
      ? "Request completed successfully."
      : "Admin request failed.",
  };
}

async function sendAdminRequest<TData>(
  path: string,
  options: RequestInit = {},
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
    throw new AdminApiError(
      payload.message || "Admin request failed.",
      response.status,
    );
  }

  return {
    message: payload.message || "Request completed successfully.",
    data:
      payload.data ??
      payload.users ??
      payload.user ??
      payload.orders ??
      payload.order ??
      payload.stats ??
      payload,
  };
}

export function formatAdminDate(value: string | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getAdminStatusLabel(status: string) {
  return status
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ") || "Unknown";
}

export async function getAdminStats() {
  const response = await sendAdminRequest<unknown>("/api/admin/stats", {
    method: "GET",
  });
  const record = unwrapRecord(response.data, ["stats", "dashboard"]);
  const userStats = findRecord(record, ["users", "userStats", "user_stats"]);
  const orderStats = findRecord(record, ["orders", "orderStats", "order_stats"]);
  const revenueStats = findRecord(record, [
    "revenue",
    "revenueStats",
    "revenue_stats",
    "sales",
  ]);
  const latestOrders = extractCollection(record, [
    "latestOrders",
    "latest_orders",
    "recentOrders",
    "recent_orders",
  ])
    .map(normalizeOrder)
    .filter((order): order is AdminOrder => Boolean(order));

  return {
    totalUsers:
      readNumber(record, ["totalUsers", "total_users", "userCount", "user_count"]) ||
      readNumber(userStats, ["total", "totalUsers", "total_users", "count"]) ||
      extractCollection(record, ["userList", "user_list", "customers"]).length,
    verifiedUsers:
      readNumber(record, ["verifiedUsers", "verified_users"]) ||
      readNumber(userStats, ["verified", "verifiedUsers", "verified_users"]),
    activeUsers:
      readNumber(record, ["activeUsers", "active_users"]) ||
      readNumber(userStats, ["active", "activeUsers", "active_users"]),
    totalOrders:
      readNumber(record, ["totalOrders", "total_orders", "orderCount", "order_count"]) ||
      readNumber(orderStats, ["total", "totalOrders", "total_orders", "count"]) ||
      extractCollection(record, ["orderList", "order_list", "items", "results"]).length,
    totalRevenue:
      readNumber(record, [
        "totalRevenue",
        "total_revenue",
        "grossRevenue",
        "gross_revenue",
      ]) ||
      readNumber(revenueStats, [
        "total",
        "totalRevenue",
        "total_revenue",
        "grossRevenue",
        "gross_revenue",
      ]),
    revenueThisMonth:
      readNumber(record, ["revenueThisMonth", "revenue_this_month", "thisMonth", "this_month"]) ||
      readNumber(revenueStats, [
        "thisMonth",
        "this_month",
        "month",
        "monthly",
        "currentMonth",
        "current_month",
      ]),
    pendingOrders: readNumber(record, [
      "pendingOrders",
      "pending_orders",
      "pendingOrderCount",
      "pending_order_count",
    ]) || readNumber(orderStats, ["pending", "pendingOrders", "pending_orders"]),
    paidOrders:
      readNumber(record, ["paidOrders", "paid_orders"]) ||
      readNumber(orderStats, ["paid", "paidOrders", "paid_orders"]),
    processingOrders:
      readNumber(record, ["processingOrders", "processing_orders"]) ||
      readNumber(orderStats, ["processing", "processingOrders", "processing_orders"]),
    completedOrders: readNumber(record, [
      "completedOrders",
      "completed_orders",
      "completedOrderCount",
      "completed_order_count",
    ]) || readNumber(orderStats, ["completed", "completedOrders", "completed_orders"]),
    cancelledOrders:
      readNumber(record, ["cancelledOrders", "cancelled_orders", "canceledOrders", "canceled_orders"]) ||
      readNumber(orderStats, [
        "cancelled",
        "canceled",
        "cancelledOrders",
        "cancelled_orders",
        "canceledOrders",
        "canceled_orders",
      ]),
    latestOrders,
    raw: record,
  } satisfies AdminStats;
}

export async function getAdminUsers() {
  const response = await sendAdminRequest<unknown>("/api/admin/users", {
    method: "GET",
  });

  return extractCollection(response.data, [
    "users",
    "accounts",
    "customers",
    "items",
    "results",
    "data",
  ])
    .map(normalizeUser)
    .filter((user): user is AdminUser => Boolean(user));
}

export async function getAdminUser(id: string) {
  const response = await sendAdminRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );

  return normalizeUser(response.data);
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload,
) {
  const requestPayload = {
    fullName: payload.fullName.trim(),
    phone: payload.phone?.trim() ?? "",
    address: payload.address?.trim() ?? "",
    role: payload.role?.trim() || "user",
  };
  const response = await sendAdminRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(requestPayload),
    },
  );

  return {
    message: response.message,
    user: normalizeUser(response.data),
  };
}

export async function deleteAdminUser(id: string) {
  const response = await sendAdminRequest(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );

  return response.message;
}

export async function updateAdminUserStatus(id: string, status: string) {
  const normalizedStatus = normalizeAccountStatus(status, "active");
  const response = await sendAdminRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: normalizedStatus }),
    },
  );

  return {
    message: response.message,
    user: normalizeUser(response.data),
  };
}

export async function getAdminOrders() {
  const response = await sendAdminRequest<unknown>("/api/admin/orders", {
    method: "GET",
  });

  return extractCollection(response.data, [
    "orders",
    "items",
    "results",
    "salesOrders",
    "sales_orders",
    "data",
  ])
    .map(normalizeOrder)
    .filter((order): order is AdminOrder => Boolean(order));
}

export async function getAdminOrder(id: string) {
  const response = await sendAdminRequest<unknown>(
    `/api/admin/orders/${encodeURIComponent(id)}`,
    {
      method: "GET",
    },
  );

  return normalizeOrder(response.data);
}

export async function updateAdminOrderStatus(id: string, status: string) {
  const response = await sendAdminRequest<unknown>(
    `/api/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );

  return {
    message: response.message,
    order: normalizeOrder(response.data),
  };
}
