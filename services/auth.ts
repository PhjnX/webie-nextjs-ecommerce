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

const ADMIN_ROLE_MARKERS = ["admin", "administrator", "super_admin", "owner"];

function readAuthUserValue(user: AuthUser | undefined, keys: string[]) {
  if (!user) {
    return undefined;
  }

  for (const key of keys) {
    const value = user[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function hasAdminRoleMarker(value: string) {
  const normalizedValue = value.toLowerCase();

  return ADMIN_ROLE_MARKERS.some((marker) => normalizedValue.includes(marker));
}

export function getAuthSessionAdminAccess(session: AuthSession | null) {
  const user = session?.user;
  const role = readAuthUserValue(user, ["role", "userRole", "user_role", "type"]);
  const roles = readAuthUserValue(user, ["roles", "permissions"]);
  const isAdmin = readAuthUserValue(user, ["isAdmin", "is_admin", "admin"]);

  if (typeof isAdmin === "boolean") {
    return isAdmin;
  }

  if (typeof role === "string") {
    return hasAdminRoleMarker(role);
  }

  if (Array.isArray(roles)) {
    return roles.some(
      (value) => typeof value === "string" && hasAdminRoleMarker(value),
    );
  }

  return null;
}

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
