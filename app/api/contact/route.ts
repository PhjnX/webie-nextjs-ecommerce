import { NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string) {
  const value = record[key];

  return typeof value === "string" ? value.trim() : "";
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

  const requiredFields = ["name", "phone", "email"];
  const missingField = requiredFields.find((field) => !readString(body, field));

  if (missingField) {
    return NextResponse.json(
      {
        success: false,
        message: `${missingField} is required.`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Thank you. We will contact you within 24 hours.",
  });
}
