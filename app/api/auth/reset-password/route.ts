import { type NextRequest, NextResponse } from "next/server";
import {
  postToAuthApi,
  readJsonBody,
  validateRequiredFields,
} from "../_utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateRequiredFields(body, [
    "email",
    "otp",
    "newPassword",
  ]);

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
    path: "/auth/reset-password",
    body,
    fallbackMessage: "Password reset successfully. You can sign in now.",
    failedFallbackMessage: "Unable to reset password with this OTP.",
  });
}
