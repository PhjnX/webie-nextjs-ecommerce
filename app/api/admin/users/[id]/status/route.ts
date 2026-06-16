import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToAdminApi,
  readJsonBody,
  validateStatusBody,
} from "../../../_utils";

interface AdminUserStatusRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: AdminUserStatusRouteContext,
) {
  const { id } = await params;
  const body = await readJsonBody(request);
  const validationError = validateStatusBody(body);

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
    path: `/admin/users/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    body,
    fallbackMessage: "User status updated successfully.",
    failedFallbackMessage: "Unable to update user status.",
  });
}
