import { NextResponse } from "next/server";

const CONTACT_API_BASE_URL =
  process.env.CONTACT_API_BASE_URL ??
  process.env.AUTH_API_BASE_URL ??
  "https://coral-mouse-470858.hostingersite.com";
const CONTACT_SUCCESS_MESSAGE =
  "Y\u00EAu c\u1EA7u t\u01B0 v\u1EA5n \u0111\u00E3 \u0111\u01B0\u1EE3c g\u1EEDi th\u00E0nh c\u00F4ng! Ch\u00FAng t\u00F4i s\u1EBD li\u00EAn h\u1EC7 b\u1EA1n trong v\u00F2ng 24 gi\u1EDD.";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string) {
  const value = record[key];

  return typeof value === "string" ? value.trim() : "";
}

function getMessage(payload: unknown, fallbackMessage: string) {
  if (isRecord(payload)) {
    return (
      readString(payload, "message") ||
      readString(payload, "error") ||
      readString(payload, "detail") ||
      fallbackMessage
    );
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return fallbackMessage;
}

async function readUpstreamPayload(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text.trim() || null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        success: false,
        message: "Request body must be a JSON object.",
      },
      { status: 400 },
    );
  }

  const fullName = readString(body, "fullName") || readString(body, "name");
  const phone = readString(body, "phone");
  const email = readString(body, "email");
  const message = readString(body, "message");
  const requiredFields = [
    ["fullName", fullName],
    ["phone", phone],
    ["email", email],
    ["message", message],
  ] as const;
  const missingField = requiredFields.find(([, value]) => !value)?.[0];

  if (missingField) {
    return NextResponse.json(
      {
        success: false,
        message: `${missingField} is required.`,
      },
      { status: 400 },
    );
  }

  const contactPayload = {
    fullName,
    phone,
    email,
    message: message,
  };

  try {
    const upstreamResponse = await fetch(`${CONTACT_API_BASE_URL}/contact`, {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactPayload),
    });
    const upstreamPayload = await readUpstreamPayload(upstreamResponse);
    console.log("Contact upstream status:", upstreamResponse.status);
    console.log("Contact upstream payload:", upstreamPayload);
    console.log("Contact payload sent:", contactPayload);
    const success =
      upstreamResponse.ok &&
      (!isRecord(upstreamPayload) || upstreamPayload.success !== false);
    const message = getMessage(
      upstreamPayload,
      success ? CONTACT_SUCCESS_MESSAGE : "Unable to send your request.",
    );

    return NextResponse.json(
      {
        success,
        message,
      },
      {
        status: success
          ? 200
          : upstreamResponse.status >= 400
            ? upstreamResponse.status
            : 400,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send your request.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 502 },
    );
  }
}
