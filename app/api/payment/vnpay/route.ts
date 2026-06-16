import { type NextRequest, NextResponse } from "next/server";
import { proxyPaymentBackend, readJsonBody } from "../_utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const orderId =
    body && typeof body === "object" && body !== null
      ? Number((body as Record<string, unknown>).orderId)
      : 0;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json(
      {
        success: false,
        message: "orderId is required.",
      },
      { status: 400 },
    );
  }

  return proxyPaymentBackend({
    request,
    path: "/payment/vnpay",
    method: "POST",
    body: { orderId },
    requireAuth: true,
    fallbackMessage: "VNPay payment created successfully.",
    failedFallbackMessage: "Unable to create VNPay payment.",
  });
}
