import { type NextRequest } from "next/server";
import { proxyJsonToAdminApi } from "../../_utils";

interface AdminOrderRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: AdminOrderRouteContext,
) {
  const { id } = await params;

  return proxyJsonToAdminApi({
    request,
    path: `/admin/orders/${encodeURIComponent(id)}`,
    method: "GET",
    fallbackMessage: "Order loaded successfully.",
    failedFallbackMessage: "Unable to load order.",
  });
}
