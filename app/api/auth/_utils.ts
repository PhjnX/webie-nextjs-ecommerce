import { type NextRequest, NextResponse } from "next/server";

const AUTH_API_BASE_URL =
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
          !normalizedKey.includes("token")
        );
      })
      .map(([key, fieldValue]) => [key, stripSensitiveFields(fieldValue)]),
  );
}

function extractToken(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const directToken = readString(payload, [
    "token",
    "accessToken",
    "access_token",
    "jwt",
  ]);

  if (directToken) {
    return directToken;
  }

  if (isRecord(payload.data)) {
    return extractToken(payload.data);
  }

  return undefined;
}

function extractUser(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const candidates = [
    payload.user,
    payload.account,
    payload.customer,
    isRecord(payload.data) ? payload.data.user : undefined,
    isRecord(payload.data) ? payload.data.account : undefined,
    isRecord(payload.data) ? payload.data.customer : undefined,
  ];

  const user = candidates.find(isRecord);

  return user ? (stripSensitiveFields(user) as JsonRecord) : undefined;
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
    user: extractUser(payload),
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

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function validateRequiredFields(body: unknown, fields: string[]) {
  if (!isRecord(body)) {
    return "Request body must be a JSON object.";
  }

  const missingField = fields.find((field) => {
    const value = body[field];

    return typeof value !== "string" || value.trim().length === 0;
  });

  return missingField ? `${missingField} is required.` : null;
}

export async function postToAuthApi({
  request,
  path,
  body,
  fallbackMessage,
  failedFallbackMessage,
  setAuthCookie = false,
  clearAuthCookie = false,
}: {
  request: NextRequest;
  path: string;
  body?: unknown;
  fallbackMessage: string;
  failedFallbackMessage: string;
  setAuthCookie?: boolean;
  clearAuthCookie?: boolean;
}) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const headers: HeadersInit = {
      accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const upstreamResponse = await fetch(`${AUTH_API_BASE_URL}${path}`, {
      method: "POST",
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
    const response = NextResponse.json(normalizedPayload, { status });
    const nextToken = setAuthCookie ? extractToken(upstreamPayload) : undefined;

    if (nextToken) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: nextToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (clearAuthCookie) {
      response.cookies.delete(AUTH_COOKIE_NAME);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected authentication error.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 502 },
    );
  }
}
