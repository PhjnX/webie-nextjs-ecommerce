export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: number | string;
  email?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  address?: string;
  [key: string]: unknown;
}

export interface AuthSession {
  email: string;
  fullName?: string;
  user?: AuthUser;
}

export interface AuthResponse<TData = unknown> {
  success: boolean;
  message: string;
  data?: TData;
  user?: AuthUser;
}

export const AUTH_SESSION_STORAGE_KEY = "webie_auth_session";

async function sendAuthRequest<TData>(
  path: string,
  body?: RegisterPayload | VerifyOtpPayload | LoginPayload,
): Promise<AuthResponse<TData>> {
  const response = await fetch(path, {
    method: "POST",
    headers: body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => ({
    success: false,
    message: "Unexpected authentication response.",
  }))) as Partial<AuthResponse<TData>>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Authentication request failed.");
  }

  return {
    success: true,
    message: payload.message || "Request completed successfully.",
    data: payload.data,
    user: payload.user,
  };
}

export function registerAccount(payload: RegisterPayload) {
  return sendAuthRequest("/api/auth/register", payload);
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return sendAuthRequest("/api/auth/verify-otp", payload);
}

export function loginAccount(payload: LoginPayload) {
  return sendAuthRequest("/api/auth/login", payload);
}

export function logoutAccount() {
  return sendAuthRequest("/api/auth/logout");
}
