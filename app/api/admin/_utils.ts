import { type NextRequest, NextResponse } from "next/server";

const ADMIN_API_BASE_URL =
  process.env.ADMIN_API_BASE_URL ??
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

function stripSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSensitiveFields);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => {
        const normalizedKey = key.toLowerCase();

        return (
          !normalizedKey.includes("password") &&
          !normalizedKey.includes("token") &&
          !normalizedKey.includes("secret")
        );
      })
      .map(([key, fieldValue]) => [key, stripSensitiveFields(fieldValue)]),
  );
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
    data: stripSensitiveFields(data),
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
      message: "Please sign in with an admin account to continue.",
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

export function validateRecordBody(body: unknown) {
  if (!isRecord(body)) {
    return "Request body must be a JSON object.";
  }

  return null;
}

export function validateStatusBody(body: unknown) {
  if (!isRecord(body)) {
    return "Request body must be a JSON object.";
  }

  const status = body.status;

  if (typeof status !== "string" || !status.trim()) {
    return "status is required.";
  }

  return null;
}

export async function proxyJsonToAdminApi({
  request,
  path,
  method,
  body,
  fallbackMessage,
  failedFallbackMessage,
  includeSearchParams = false,
}: {
  request: NextRequest;
  path: string;
  method: "GET" | "PATCH" | "DELETE";
  body?: unknown;
  fallbackMessage: string;
  failedFallbackMessage: string;
  includeSearchParams?: boolean;
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

    const queryString = includeSearchParams
      ? request.nextUrl.search
      : "";
    const upstreamResponse = await fetch(
      `${ADMIN_API_BASE_URL}${path}${queryString}`,
      {
        method,
        cache: "no-store",
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
    );
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
      error instanceof Error ? error.message : "Unexpected admin API error.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 502 },
    );
  }
}
