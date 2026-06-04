import { type NextRequest, NextResponse } from "next/server";
import {
  postToAuthApi,
  readJsonBody,
  validateRequiredFields,
} from "../_utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateRequiredFields(body, ["email", "otp"]);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 },
    );
  }

  return postToAuthApi({
    request,
    path: "/auth/verify-otp",
    body,
    fallbackMessage: "Account verified. You can sign in now.",
    failedFallbackMessage: "Unable to verify this OTP.",
  });
}
