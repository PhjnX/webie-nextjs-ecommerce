import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToAdminApi,
  readJsonBody,
  validateRecordBody,
} from "../../_utils";

interface AdminUserRouteContext {
  params: Promise<{ id: string }>;
}

function readUpdateValue(
  record: Record<string, unknown>,
  keys: string[],
  allowEmpty = false,
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (trimmedValue || allowEmpty) {
        return trimmedValue;
      }
    }
  }

  return undefined;
}

function normalizeUserUpdateBody(body: Record<string, unknown>) {
  const fullName = readUpdateValue(body, ["fullName", "full_name", "name"]);

  if (!fullName) {
    return {
      error: "fullName is required.",
    };
  }

  return {
    payload: {
      fullName,
      phone: readUpdateValue(body, ["phone", "phoneNumber", "phone_number"], true) ?? "",
      address: readUpdateValue(body, ["address", "streetAddress", "street_address"], true) ?? "",
      role: readUpdateValue(body, ["role", "userRole", "user_role"], true) || "user",
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: AdminUserRouteContext,
) {
  const { id } = await params;

  return proxyJsonToAdminApi({
    request,
    path: `/admin/users/${encodeURIComponent(id)}`,
    method: "GET",
    fallbackMessage: "User loaded successfully.",
    failedFallbackMessage: "Unable to load user.",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: AdminUserRouteContext,
) {
  const { id } = await params;
  const body = await readJsonBody(request);
  const validationError = validateRecordBody(body);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 },
    );
  }

  const normalizedBody = normalizeUserUpdateBody(
    body as Record<string, unknown>,
  );

  if (normalizedBody.error) {
    return NextResponse.json(
      {
        success: false,
        message: normalizedBody.error,
      },
      { status: 400 },
    );
  }

  return proxyJsonToAdminApi({
    request,
    path: `/admin/users/${encodeURIComponent(id)}`,
    method: "PATCH",
    body: normalizedBody.payload,
    fallbackMessage: "User updated successfully.",
    failedFallbackMessage: "Unable to update user.",
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: AdminUserRouteContext,
) {
  const { id } = await params;

  return proxyJsonToAdminApi({
    request,
    path: `/admin/users/${encodeURIComponent(id)}`,
    method: "DELETE",
    fallbackMessage: "User deleted successfully.",
    failedFallbackMessage: "Unable to delete user.",
  });
}
