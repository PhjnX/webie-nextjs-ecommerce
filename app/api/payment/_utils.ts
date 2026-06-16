import { type NextRequest, NextResponse } from "next/server";

const PAYMENT_API_BASE_URL =
  process.env.PAYMENT_API_BASE_URL ??
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
  const responseText = await response.text();
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json") && responseText.trim()) {
    try {
      return JSON.parse(responseText);
    } catch {
      return responseText.trim();
    }
  }

  return responseText.trim() || null;
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

export async function fetchPaymentBackend({
  request,
  path,
  method,
  body,
  requireAuth,
  includeSearchParams = false,
  fallbackMessage,
  failedFallbackMessage,
}: {
  request: NextRequest;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  requireAuth: boolean;
  includeSearchParams?: boolean;
  fallbackMessage: string;
  failedFallbackMessage: string;
}) {
  const token = getAuthToken(request);

  if (requireAuth && !token) {
    return {
      response: unauthorizedResponse(),
      payload: {
        success: false,
        message: "Please sign in to continue.",
        data: null,
      },
    };
  }

  const headers: HeadersInit = {
    accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const queryString = includeSearchParams ? request.nextUrl.search : "";
  const upstreamResponse = await fetch(
    `${PAYMENT_API_BASE_URL}${path}${queryString}`,
    {
      method,
      cache: "no-store",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
  );
  const upstreamPayload = await readUpstreamPayload(upstreamResponse);
  const payload = normalizePayload(
    upstreamPayload,
    upstreamResponse.ok,
    fallbackMessage,
    failedFallbackMessage,
  );
  const status = payload.success
    ? 200
    : upstreamResponse.status >= 400
      ? upstreamResponse.status
      : 400;

  return {
    response: NextResponse.json(payload, { status }),
    payload,
  };
}

export async function proxyPaymentBackend(args: Parameters<typeof fetchPaymentBackend>[0]) {
  try {
    const { response } = await fetchPaymentBackend(args);

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected payment error.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 502 },
    );
  }
}
