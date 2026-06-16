import { type NextRequest, NextResponse } from "next/server";
import { fetchPaymentBackend } from "../../_utils";

function getOrderIdFromPaymentReturn(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return (
    searchParams.get("orderId") ??
    searchParams.get("order_id") ??
    searchParams.get("vnp_TxnRef") ??
    searchParams.get("vnp_Txnref") ??
    ""
  );
}

export async function GET(request: NextRequest) {
  let success = false;

  try {
    const result = await fetchPaymentBackend({
      request,
      path: "/payment/vnpay/return",
      method: "GET",
      requireAuth: false,
      includeSearchParams: true,
      fallbackMessage: "VNPay return processed successfully.",
      failedFallbackMessage: "Unable to process VNPay return.",
    });

    success = result.payload.success;
  } catch {
    success = false;
  }

  const orderId = getOrderIdFromPaymentReturn(request);
  const redirectUrl = new URL(
    orderId ? `/profile/orders/${encodeURIComponent(orderId)}` : "/profile",
    request.url,
  );

  if (!orderId) {
    redirectUrl.searchParams.set("section", "orders");
  }

  redirectUrl.searchParams.set("payment", success ? "success" : "failed");

  return NextResponse.redirect(redirectUrl);
}
