import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToAdminApi,
  readJsonBody,
  validateStatusBody,
} from "../../../_utils";

interface AdminOrderStatusRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: AdminOrderStatusRouteContext,
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
    path: `/admin/orders/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    body,
    fallbackMessage: "Order status updated successfully.",
    failedFallbackMessage: "Unable to update order status.",
  });
}
