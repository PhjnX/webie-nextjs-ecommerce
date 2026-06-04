import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToUserApi,
  readJsonBody,
  validateRequiredFields,
} from "../_utils";

export async function PATCH(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateRequiredFields(body, [
    "currentPassword",
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

  return proxyJsonToUserApi({
    request,
    path: "/user/change-password",
    method: "PATCH",
    body,
    fallbackMessage: "Password changed successfully.",
    failedFallbackMessage: "Unable to change password.",
  });
}
