import { type NextRequest } from "next/server";
import { proxyJsonToUserApi } from "../user/_utils";

export async function GET(request: NextRequest) {
  return proxyJsonToUserApi({
    request,
    path: "/order",
    method: "GET",
    fallbackMessage: "Orders loaded successfully.",
    failedFallbackMessage: "Unable to load orders.",
  });
}
