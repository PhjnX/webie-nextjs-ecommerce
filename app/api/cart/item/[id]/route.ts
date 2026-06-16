import { type NextRequest, NextResponse } from "next/server";
import { proxyJsonToCartApi, readJsonBody } from "../../_utils";

function parseId(value: string | undefined) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "id of product is required.",
      },
      { status: 400 },
    );
  }

  const body = await readJsonBody(request);
  const bodyRecord =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  return proxyJsonToCartApi({
    request,
    path: `/cart/item/${encodeURIComponent(id)}`,
    method: "PATCH",
    body: bodyRecord,
    fallbackMessage: "Cart item quantity updated successfully.",
    failedFallbackMessage: "Unable to update cart item quantity.",
  });
}
