import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToUserApi,
  readJsonBody,
  validateRequiredFields,
} from "../_utils";

export async function GET(request: NextRequest) {
  return proxyJsonToUserApi({
    request,
    path: "/user/profile",
    method: "GET",
    fallbackMessage: "Profile loaded successfully.",
    failedFallbackMessage: "Unable to load profile.",
  });
}

export async function PATCH(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateRequiredFields(body, [
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

  return proxyJsonToUserApi({
    request,
    path: "/user/profile",
    method: "PATCH",
    body,
    fallbackMessage: "Profile updated successfully.",
    failedFallbackMessage: "Unable to update profile.",
  });
}
