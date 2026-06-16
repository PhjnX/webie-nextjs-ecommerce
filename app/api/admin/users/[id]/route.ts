import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToAdminApi,
  readJsonBody,
  validateRecordBody,
} from "../../_utils";

interface AdminUserRouteContext {
  params: Promise<{ id: string }>;
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

  return proxyJsonToAdminApi({
    request,
    path: `/admin/users/${encodeURIComponent(id)}`,
    method: "PATCH",
    body,
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
