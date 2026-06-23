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

function readBoolean(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const normalizedValue = value.trim().toLowerCase();

      if (["true", "1", "yes", "blocked", "locked", "deleted"].includes(normalizedValue)) {
        return true;
      }

      if (["false", "0", "no", "active"].includes(normalizedValue)) {
        return false;
      }
    }
  }

  return null;
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

  const data = isRecord(payload.data) ? payload.data : undefined;
  const candidates = [
    payload.user,
    payload.account,
    payload.customer,
    data?.user,
    data?.account,
    data?.customer,
    data,
    payload,
  ];

  const user = candidates.find(
    (candidate): candidate is JsonRecord =>
      isRecord(candidate) && looksLikeUserRecord(candidate),
  );

  return user ? (stripSensitiveFields(user) as JsonRecord) : undefined;
}

function looksLikeUserRecord(record: JsonRecord) {
  return [
    "id",
    "userId",
    "user_id",
    "email",
    "fullName",
    "full_name",
    "name",
    "role",
    "status",
    "accountStatus",
    "account_status",
    "is_active",
    "isActive",
    "active",
    "blocked",
    "isBlocked",
    "is_blocked",
    "locked",
    "isLocked",
    "is_locked",
    "deleted",
    "isDeleted",
    "is_deleted",
  ].some((key) => key in record);
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

function isBlockedOrDeletedUser(user: JsonRecord | undefined) {
  if (!user) {
    return false;
  }

  const active = readBoolean(user, [
    "is_active",
    "isActive",
    "active",
    "enabled",
    "is_enabled",
    "isEnabled",
  ]);

  if (active === false) {
    return true;
  }

  const locked = readBoolean(user, [
    "blocked",
    "isBlocked",
    "is_blocked",
    "locked",
    "isLocked",
    "is_locked",
    "deleted",
    "isDeleted",
    "is_deleted",
    "disabled",
    "isDisabled",
    "is_disabled",
  ]);

  if (locked === true) {
    return true;
  }

  const status = readString(user, [
    "status",
    "accountStatus",
    "account_status",
    "state",
  ])?.toLowerCase();

  return Boolean(
    status &&
      ["blocked", "locked", "disabled", "inactive", "deleted"].includes(status),
  );
}

async function readUpstreamPayload(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text.trim() || null;
}

async function fetchAuthenticatedUser(token: string) {
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/user/profile`, {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return undefined;
    }

    return extractUser(await readUpstreamPayload(response));
  } catch {
    return undefined;
  }
}

function blockedSignInResponse() {
  const response = NextResponse.json(
    {
      success: false,
      message: "This account is blocked or deleted and cannot sign in.",
    },
    { status: 403 },
  );

  response.cookies.delete(AUTH_COOKIE_NAME);

  return response;
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
    const nextToken = setAuthCookie ? extractToken(upstreamPayload) : undefined;

    if (setAuthCookie && normalizedPayload.success) {
      const authenticatedUser = nextToken
        ? await fetchAuthenticatedUser(nextToken)
        : undefined;
      const blockedUser =
        isBlockedOrDeletedUser(normalizedPayload.user) ||
        isBlockedOrDeletedUser(authenticatedUser);

      if (blockedUser) {
        return blockedSignInResponse();
      }

      if (!normalizedPayload.user && authenticatedUser) {
        normalizedPayload.user = authenticatedUser;
      }
    }

    const response = NextResponse.json(normalizedPayload, { status });

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
