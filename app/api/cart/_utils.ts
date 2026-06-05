import { type NextRequest, NextResponse } from "next/server";

const CART_API_BASE_URL =
  process.env.CART_API_BASE_URL ??
  process.env.AUTH_API_BASE_URL ??
  "https://coral-mouse-470858.hostingersite.com";
const AUTH_COOKIE_NAME = "webie_auth_token";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function extractMessage(
  payload: unknown,
  fallbackMessage: string,
  failedFallbackMessage: string,
  success: boolean,
) {
  if (isRecord(payload)) {
    return (
      readString(payload, ["message", "error", "detail"]) ??
      (success ? fallbackMessage : failedFallbackMessage)
    );
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return success ? fallbackMessage : failedFallbackMessage;
}

function normalizePayload(
  payload: unknown,
  upstreamOk: boolean,
  fallbackMessage: string,
  failedFallbackMessage: string,
) {
  const upstreamSuccess =
    isRecord(payload) && typeof payload.success === "boolean"
      ? payload.success
      : undefined;
  const success = upstreamOk && upstreamSuccess !== false;
  const data = isRecord(payload) && "data" in payload ? payload.data : payload;

  return {
    success,
    message: extractMessage(
      payload,
      fallbackMessage,
      failedFallbackMessage,
      success,
    ),
    data,
  };
}

async function readUpstreamPayload(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text.trim() || null;
}

function getAuthToken(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Please sign in to continue.",
    },
    { status: 401 },
  );
}

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function validateProductId(body: unknown) {
  if (!isRecord(body)) {
    return "Request body must be a JSON object.";
  }

  const productId = Number(body.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    return "productId is required.";
  }

  return null;
}

export async function proxyJsonToCartApi({
  request,
  path,
  method,
  body,
  fallbackMessage,
  failedFallbackMessage,
}: {
  request: NextRequest;
  path: string;
  method: "GET" | "POST" | "DELETE";
  body?: unknown;
  fallbackMessage: string;
  failedFallbackMessage: string;
}) {
  try {
    const token = getAuthToken(request);

    if (!token) {
      return unauthorizedResponse();
    }

    const headers: HeadersInit = {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const upstreamResponse = await fetch(`${CART_API_BASE_URL}${path}`, {
      method,
      cache: "no-store",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const upstreamPayload = await readUpstreamPayload(upstreamResponse);
    const normalizedPayload = normalizePayload(
      upstreamPayload,
      upstreamResponse.ok,
      fallbackMessage,
      failedFallbackMessage,
    );
    const status = normalizedPayload.success
      ? 200
      : upstreamResponse.status >= 400
        ? upstreamResponse.status
        : 400;

    return NextResponse.json(normalizedPayload, { status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected cart error.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 502 },
    );
  }
}
