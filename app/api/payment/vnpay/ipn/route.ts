import { type NextRequest } from "next/server";
import { proxyPaymentBackend } from "../../_utils";

export async function GET(request: NextRequest) {
  return proxyPaymentBackend({
    request,
    path: "/payment/vnpay/ipn",
    method: "GET",
    requireAuth: false,
    includeSearchParams: true,
    fallbackMessage: "VNPay IPN processed successfully.",
    failedFallbackMessage: "Unable to process VNPay IPN.",
  });
}
