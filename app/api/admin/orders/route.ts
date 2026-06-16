import { type NextRequest } from "next/server";
import { proxyJsonToAdminApi } from "../_utils";

export async function GET(request: NextRequest) {
  return proxyJsonToAdminApi({
    request,
    path: "/admin/orders",
    method: "GET",
    includeSearchParams: true,
    fallbackMessage: "Orders loaded successfully.",
    failedFallbackMessage: "Unable to load orders.",
  });
}
