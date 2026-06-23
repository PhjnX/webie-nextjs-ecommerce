import { type NextRequest, NextResponse } from "next/server";
import { fetchPaymentBackend } from "../_utils";

const PAYMENT_SUCCESS_PARAM = "success";
const PAYMENT_FAILED_PARAM = "failed";

function normalizeOrderId(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const leadingNumericId = trimmedValue.match(/^\d+/)?.[0];

  return leadingNumericId ?? trimmedValue;
}

export function getOrderIdFromPaymentReturn(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawOrderId =
    searchParams.get("orderId") ??
    searchParams.get("order_id") ??
    searchParams.get("vnp_TxnRef") ??
    searchParams.get("vnp_Txnref") ??
    "";

  return normalizeOrderId(rawOrderId);
}

export async function getVnpayReturnResult(request: NextRequest) {
  const orderId = getOrderIdFromPaymentReturn(request);

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

    return {
      orderId,
      success: result.payload.success,
    };
  } catch {
    return {
      orderId,
      success: false,
    };
  }
}

export async function redirectAfterVnpayReturn(request: NextRequest) {
  const result = await getVnpayReturnResult(request);
  const redirectUrl = new URL(
    result.success
      ? "/"
      : result.orderId
        ? `/profile/orders/${encodeURIComponent(result.orderId)}`
        : "/",
    request.url,
  );

  redirectUrl.searchParams.set(
    "payment",
    result.success ? PAYMENT_SUCCESS_PARAM : PAYMENT_FAILED_PARAM,
  );

  if (result.orderId) {
    redirectUrl.searchParams.set("orderId", result.orderId);
  }

  return NextResponse.redirect(redirectUrl);
}
