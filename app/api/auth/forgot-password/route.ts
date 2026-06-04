import { type NextRequest, NextResponse } from "next/server";
import {
  postToAuthApi,
  readJsonBody,
  validateRequiredFields,
} from "../_utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateRequiredFields(body, ["email"]);

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
    path: "/auth/forgot-password",
    body,
    fallbackMessage: "OTP sent. Check your email to reset your password.",
    failedFallbackMessage: "Unable to send a reset OTP for this email.",
  });
}
