import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_SESSION_UPDATED_EVENT,
  type AuthSession,
  type AuthUser,
} from "@/services/auth";

export interface UserProfile {
  id?: number | string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  raw?: Record<string, unknown>;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  address: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface ApiResponse<TData = unknown> {
  success?: boolean;
  message?: string;
  data?: TData;
  user?: TData;
}

export class UserApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UserApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function unwrapRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {};
  }

  const candidates = [
    value.profile,
    value.user,
    value.customer,
    value.account,
    value.data,
  ];
  const nestedRecord = candidates.find(isRecord);

  return nestedRecord ?? value;
}

function toUserProfile(value: unknown): UserProfile {
  const profile = unwrapRecord(value);
  const id = profile.id;

  return {
    id: typeof id === "number" || typeof id === "string" ? id : undefined,
    email: readString(profile, ["email"]),
    fullName: readString(profile, ["fullName", "full_name", "name"]),
    phone: readString(profile, ["phone", "phoneNumber", "phone_number"]),
    address: readString(profile, ["address", "streetAddress", "street_address"]),
    avatarUrl: readString(profile, [
      "avatarUrl",
      "avatar_url",
      "avatar",
      "imageUrl",
      "image_url",
    ]),
    raw: profile,
  };
}

async function readApiResponse<TData>(
  response: Response,
): Promise<ApiResponse<TData>> {
  return (await response.json().catch(() => ({
    success: false,
    message: "Unexpected profile response.",
  }))) as ApiResponse<TData>;
}

async function sendJsonRequest<TData>(
  path: string,
  method: "GET" | "PATCH",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers: body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await readApiResponse<TData>(response);

  if (!response.ok || payload.success === false) {
    throw new UserApiError(
      payload.message || "Profile request failed.",
      response.status,
    );
  }

  return {
    success: true,
    message: payload.message || "Request completed successfully.",
    data: payload.data ?? payload.user,
  };
}

export async function getUserProfile() {
  const response = await sendJsonRequest("/api/user/profile", "GET");

  return toUserProfile(response.data);
}

export async function updateUserProfile(payload: UpdateProfilePayload) {
  const response = await sendJsonRequest(
    "/api/user/profile",
    "PATCH",
    payload,
  );

  return {
    message: response.message,
    profile: toUserProfile(response.data ?? payload),
  };
}

export async function changeUserPassword(payload: ChangePasswordPayload) {
  const response = await sendJsonRequest(
    "/api/user/change-password",
    "PATCH",
    payload,
  );

  return response.message;
}

export async function uploadUserAvatar(file: File) {
  const formData = new FormData();

  formData.set("file", file);

  const response = await fetch("/api/user/avatar", {
    method: "POST",
    body: formData,
  });
  const payload = await readApiResponse(response);

  if (!response.ok || payload.success === false) {
    throw new UserApiError(
      payload.message || "Avatar upload failed.",
      response.status,
    );
  }

  return {
    message: payload.message || "Avatar uploaded successfully.",
    profile: toUserProfile(payload.data),
  };
}

export function syncStoredAuthSession(profile: UserProfile) {
  if (typeof window === "undefined") {
    return;
  }

  const storedSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  let currentSession: AuthSession | null = null;

  if (storedSession) {
    try {
      currentSession = JSON.parse(storedSession) as AuthSession;
    } catch {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }

  const nextUser: AuthUser = {
    ...(currentSession?.user ?? {}),
    ...(profile.raw ?? {}),
    email: profile.email || currentSession?.email,
    fullName: profile.fullName || currentSession?.fullName,
    phone: profile.phone,
    address: profile.address,
    avatarUrl:
      profile.avatarUrl ||
      readString(currentSession?.user ?? {}, [
        "avatarUrl",
        "avatar_url",
        "avatar",
        "imageUrl",
        "image_url",
      ]),
  };
  const nextSession: AuthSession = {
    email: profile.email || currentSession?.email || "",
    fullName: profile.fullName || currentSession?.fullName,
    user: nextUser,
  };

  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(nextSession),
  );
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}
