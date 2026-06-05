import { type NextRequest, NextResponse } from "next/server";
import { proxyJsonToCartApi, readJsonBody } from "../_utils";

function parseId(value: string | undefined) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryId = parseId(searchParams.get("id") ?? undefined);
  const queryProductId = parseId(searchParams.get("productId") ?? undefined);
  const queryCartItemId = parseId(searchParams.get("cartItemId") ?? undefined);
  const body = await readJsonBody(request);
  const bodyId =
    body && typeof body === "object" && body !== null
      ? parseId(String((body as Record<string, unknown>).id ?? ""))
      : null;
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

