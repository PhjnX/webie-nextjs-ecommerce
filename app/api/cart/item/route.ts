import { type NextRequest, NextResponse } from "next/server";
import { proxyJsonToCartApi, readJsonBody } from "../_utils";

function parseId(value: string | undefined) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function readBodyRecord(body: unknown) {
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryId = parseId(searchParams.get("id") ?? undefined);
  const queryProductId = parseId(searchParams.get("productId") ?? undefined);
  const queryCartItemId = parseId(searchParams.get("cartItemId") ?? undefined);
  const body = await readJsonBody(request);
  const bodyRecord = readBodyRecord(body);
  const bodyId = parseId(String(bodyRecord.id ?? ""));
  const id = queryId ?? queryCartItemId ?? queryProductId ?? bodyId;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "id of product is required.",
      },
      { status: 400 },
    );
  }

  return proxyJsonToCartApi({
    request,
    path: `/cart/item/${encodeURIComponent(id)}`,
    method: "DELETE",
    body: { id },
    fallbackMessage: "Cart item removed successfully.",
    failedFallbackMessage: "Unable to remove cart item.",
  });
}

export async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryId = parseId(searchParams.get("id") ?? undefined);
  const queryProductId = parseId(searchParams.get("productId") ?? undefined);
  const queryCartItemId = parseId(searchParams.get("cartItemId") ?? undefined);
  const body = await readJsonBody(request);
  const bodyRecord = readBodyRecord(body);
  const bodyId = parseId(String(bodyRecord.id ?? ""));
  const id = queryId ?? queryCartItemId ?? queryProductId ?? bodyId;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "id of product is required.",
      },
      { status: 400 },
    );
  }

  return proxyJsonToCartApi({
    request,
    path: `/cart/item/${encodeURIComponent(id)}`,
    method: "PATCH",
    body: bodyRecord,
    fallbackMessage: "Cart item quantity updated successfully.",
    failedFallbackMessage: "Unable to update cart item quantity.",
  });
}

