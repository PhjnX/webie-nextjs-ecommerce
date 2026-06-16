import { type NextRequest } from "next/server";
import { proxyJsonToUserApi, readJsonBody } from "../../user/_utils";

function readCheckoutNote(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Checkout from profile card.";
  }

  const note = (body as Record<string, unknown>).note;

  return typeof note === "string" && note.trim()
    ? note.trim()
    : "Checkout from profile card.";
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  return proxyJsonToUserApi({
    request,
    path: "/order/checkout",
    method: "POST",
    body: {
      note: readCheckoutNote(body),
    },
    fallbackMessage: "Order created successfully.",
    failedFallbackMessage: "Unable to checkout order.",
  });
}
