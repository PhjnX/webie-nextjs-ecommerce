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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthUser {
  id?: number | string;
  email?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  avatar_url?: string;
  avatar?: string;
  imageUrl?: string;
  image_url?: string;
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
export const AUTH_SESSION_UPDATED_EVENT = "webie_auth_session_updated";

export function readStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);

    return null;
  }
}

export function storeAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
}

async function sendAuthRequest<TData>(
  path: string,
  body?:
    | RegisterPayload
    | VerifyOtpPayload
    | LoginPayload
    | ForgotPasswordPayload
    | ResetPasswordPayload,
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

export function forgotPassword(payload: ForgotPasswordPayload) {
  return sendAuthRequest("/api/auth/forgot-password", payload);
}

export function resetPassword(payload: ResetPasswordPayload) {
  return sendAuthRequest("/api/auth/reset-password", payload);
}

export function logoutAccount() {
  return sendAuthRequest("/api/auth/logout");
}
