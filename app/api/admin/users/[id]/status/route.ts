import { type NextRequest } from "next/server";
import { proxyJsonToAdminApi } from "../../../_utils";

interface AdminUserStatusRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
    request: NextRequest,
    { params }: AdminUserStatusRouteContext,
) {
  const { id } = await params;

  return proxyJsonToAdminApi({
    request,
    path: `/admin/users/${id}/status`,
    method: "PATCH",
    fallbackMessage: "User status updated successfully.",
    failedFallbackMessage: "Unable to update user status.",
  });
}