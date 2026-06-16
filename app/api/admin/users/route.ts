import { type NextRequest } from "next/server";
import { proxyJsonToAdminApi } from "../_utils";

export async function GET(request: NextRequest) {
  return proxyJsonToAdminApi({
    request,
    path: "/admin/users",
    method: "GET",
    includeSearchParams: true,
    fallbackMessage: "Users loaded successfully.",
    failedFallbackMessage: "Unable to load users.",
  });
}
