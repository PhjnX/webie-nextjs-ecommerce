import { type NextRequest, NextResponse } from "next/server";
import { proxyJsonToUserApi } from "../../../user/_utils";

function parseOrderId(value: string | undefined) {
  const orderId = Number(value);

  return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const orderId = parseOrderId(idParam);

  if (!orderId) {
    return NextResponse.json(
      {
        success: false,
        message: "Order ID is required.",
      },
      { status: 400 },
    );
  }

  return proxyJsonToUserApi({
    request,
    path: `/order/${encodeURIComponent(orderId)}/cancel`,
    method: "PATCH",
    fallbackMessage: "Order cancelled successfully.",
    failedFallbackMessage: "Unable to cancel order.",
  });
}
