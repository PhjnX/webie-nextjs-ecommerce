import { type NextRequest } from "next/server";
import { proxyJsonToAdminApi } from "../_utils";

export async function GET(request: NextRequest) {
  return proxyJsonToAdminApi({
    request,
    path: "/admin/stats",
    method: "GET",
    fallbackMessage: "Dashboard statistics loaded successfully.",
    failedFallbackMessage: "Unable to load dashboard statistics.",
  });
}
