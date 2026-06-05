import { type NextRequest, NextResponse } from "next/server";
import {
  proxyJsonToCartApi,
  readJsonBody,
  validateProductId,
} from "../_utils";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const validationError = validateProductId(body);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 },
    );
  }

  return proxyJsonToCartApi({
    request,
    path: "/cart/add",
    method: "POST",
    body,
    fallbackMessage: "Product added to cart.",
    failedFallbackMessage: "Unable to add product to cart.",
  });
}
