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
    "password",
    "fullName",
    "phone",
    "address",
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
    path: "/auth/register",
    body,
    fallbackMessage: "Registration started. Check your email for the OTP.",
    failedFallbackMessage: "Unable to register this account.",
  });
}
