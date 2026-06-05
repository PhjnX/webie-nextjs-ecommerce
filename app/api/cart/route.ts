import { type NextRequest } from "next/server";
import { proxyJsonToCartApi } from "./_utils";

export async function GET(request: NextRequest) {
  return proxyJsonToCartApi({
    request,
    path: "/cart",
    method: "GET",
    fallbackMessage: "Cart loaded successfully.",
    failedFallbackMessage: "Unable to load cart.",
  });
}

export async function DELETE(request: NextRequest) {
  return proxyJsonToCartApi({
    request,
    path: "/cart",
    method: "DELETE",
    fallbackMessage: "Cart cleared successfully.",
    failedFallbackMessage: "Unable to clear cart.",
  });
}
