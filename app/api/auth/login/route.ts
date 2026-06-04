import { type NextRequest, NextResponse } from "next/server";
import {
  postToAuthApi,
  readJsonBody,
  validateRequiredFields,
} from "../_utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateRequiredFields(body, ["email", "password"]);

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
    path: "/auth/login",
    body,
    fallbackMessage: "Signed in successfully.",
    failedFallbackMessage: "Unable to sign in with those credentials.",
    setAuthCookie: true,
  });
}
