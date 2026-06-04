import { type NextRequest } from "next/server";
import { postToAuthApi } from "../_utils";

export async function POST(request: NextRequest) {
  return postToAuthApi({
    request,
    path: "/auth/logout",
    fallbackMessage: "Signed out successfully.",
    failedFallbackMessage: "Unable to sign out remotely. Local session cleared.",
    clearAuthCookie: true,
  });
}
