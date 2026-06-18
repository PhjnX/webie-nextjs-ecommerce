"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  forgotPassword,
  loginAccount,
  logoutAccount,
  registerAccount,
  resetPassword,
  type AuthResponse,
  type AuthSession,
  type AuthUser,
  verifyOtp,
} from "@/services/auth";

type AuthMode = "login" | "register" | "verify" | "forgot" | "reset";
export type LoginAudience = "customer" | "admin";

interface AuthDialogProps {
  open: boolean;
  session: AuthSession | null;
  defaultLoginAudience?: LoginAudience;
  onClose: () => void;
  onAuthenticated: (session: AuthSession, loginAudience?: LoginAudience) => void;
  onLogout: () => void;
}

const ADMIN_LOGIN_PATH = "/admin";
const inputClass =
  "h-12 w-full rounded-md border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#D8C97B] focus:ring-2 focus:ring-[#D8C97B]/20";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected auth error.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasAuthUserMarker(value: Record<string, unknown>) {
  return [
    "email",
    "fullName",
    "name",
    "role",
    "userRole",
    "user_role",
    "isAdmin",
    "is_admin",
    "admin",
  ].some((key) => key in value);
}

function getResponseUser(response: AuthResponse) {
  if (response.user) {
    return response.user;
  }

  const data = response.data;
  const candidates = isRecord(data)
    ? [data.user, data.account, data.customer, data]
    : [];
  const user = candidates.find(
    (value): value is AuthUser => isRecord(value) && hasAuthUserMarker(value),
  );

  return user;
}

function getUserName(user?: AuthUser) {
  const value = user?.fullName ?? user?.name;

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getUserEmail(user: AuthUser | undefined, fallbackEmail: string) {
  return typeof user?.email === "string" && user.email.trim()
    ? user.email.trim()
    : fallbackEmail;
}

function createSession(
  response: AuthResponse,
  fallbackEmail: string,
  fallbackName?: string,
): AuthSession {
  const user = getResponseUser(response);

  return {
    email: getUserEmail(user, fallbackEmail),
    fullName: getUserName(user) ?? fallbackName,
    user,
  };
}

export default function AuthDialog({
  open,
  session,
  defaultLoginAudience = "customer",
  onClose,
  onAuthenticated,
  onLogout,
}: AuthDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loginAudience, setLoginAudience] =
    useState<LoginAudience>(defaultLoginAudience);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
  });
  const [verifyForm, setVerifyForm] = useState({
    email: "",
    otp: "",
  });
  const [forgotForm, setForgotForm] = useState({
    email: "",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const title = useMemo(() => {
    if (session) {
      return "Account";
    }

    if (mode === "register") {
      return "Create account";
    }

    if (mode === "verify") {
      return "Verify email";
    }

    if (mode === "forgot") {
      return "Forgot password";
    }

    if (mode === "reset") {
      return "Reset password";
    }

    return "Log in";
  }, [mode, session]);

  if (!open) {
    return null;
  }

  const closeDialog = () => {
    setErrorMessage("");
    setStatusMessage("");
    setLoginAudience(defaultLoginAudience);
    onClose();
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage("");
    setStatusMessage("");
  };

  const openForgotPassword = () => {
    setForgotForm({
      email: loginForm.email.trim(),
    });
    switchMode("forgot");
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const payload = {
        email: registerForm.email.trim(),
        password: registerForm.password,
        fullName: registerForm.fullName.trim(),
        phone: registerForm.phone.trim(),
        address: registerForm.address.trim(),
      };
      const response = await registerAccount(payload);

      setVerifyForm({
        email: payload.email,
        otp: "",
      });
      setStatusMessage(
        response.message || "OTP sent. Check your email to verify the account.",
      );
      setMode("verify");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const payload = {
        email: verifyForm.email.trim(),
        otp: verifyForm.otp.trim(),
      };
      const response = await verifyOtp(payload);

      setLoginForm((current) => ({
        ...current,
        email: payload.email,
      }));
      setStatusMessage(
        response.message || "Account verified. You can sign in now.",
      );
      setMode("login");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const payload = {
        email: loginForm.email.trim(),
        password: loginForm.password,
      };
      const response = await loginAccount(payload);
      const nextSession = createSession(
        response,
        payload.email,
        registerForm.email.trim() === payload.email
          ? registerForm.fullName.trim()
          : undefined,
      );

      // if (
      //   loginAudience === "admin" &&
      //   getAuthSessionAdminAccess(nextSession) !== true
      // ) {
      //   await logoutAccount().catch(() => undefined);
      //   throw new Error("This account is not marked as an admin account.");
      // }

      onAuthenticated(nextSession, loginAudience);
      setStatusMessage(response.message || "Signed in successfully.");
      window.setTimeout(() => {
        closeDialog();

        if (loginAudience === "admin") {
          router.push(ADMIN_LOGIN_PATH);
        }
      }, 450);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const payload = {
        email: forgotForm.email.trim(),
      };
      const response = await forgotPassword(payload);

      setResetForm({
        email: payload.email,
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStatusMessage(
        response.message || "OTP sent. Check your email to reset your password.",
      );
      setMode("reset");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      if (resetForm.newPassword !== resetForm.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const payload = {
        email: resetForm.email.trim(),
        otp: resetForm.otp.trim(),
        newPassword: resetForm.newPassword,
      };
      const response = await resetPassword(payload);

      setLoginForm({
        email: payload.email,
        password: "",
      });
      setStatusMessage(
        response.message || "Password reset successfully. You can sign in now.",
      );
      setMode("login");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (processing) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {
      await logoutAccount();
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    } finally {
      onLogout();
      setProcessing(false);
      // setMode("login");
      closeDialog();

    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-stone-100 bg-white p-6 shadow-2xl shadow-stone-950/20 md:p-8">
        <button
          type="button"
          onClick={closeDialog}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-50 hover:text-stone-950"
          aria-label="Close auth dialog"
        >
          <X size={17} />
        </button>

        <div className="mb-7 pr-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b39a42]">
            Webie E-Commerce Account
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-950">
            {title}
          </h2>
        </div>

        {session ? (
          <div>
            <div className="rounded-xl border border-stone-100 bg-stone-50 p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white">
                  <UserRound size={19} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {session.fullName || session.email}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{session.email}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={processing}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-stone-950 bg-white text-sm font-bold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-stone-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <LogOut size={16} />
              Log out
            </button>
          </div>
        ) : (
          <>
            {mode === "login" || mode === "register" ? (
              <div className="mb-6 grid grid-cols-2 rounded-md bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`h-10 rounded text-xs font-bold uppercase tracking-[0.16em] transition ${
                    mode === "login"
                      ? "bg-white text-stone-950 shadow-sm"
                      : "text-stone-500 hover:text-stone-950"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`h-10 rounded text-xs font-bold uppercase tracking-[0.16em] transition ${
                    mode === "register"
                      ? "bg-white text-stone-950 shadow-sm"
                      : "text-stone-500 hover:text-stone-950"
                  }`}
                >
                  Register
                </button>
              </div>
            ) : mode === "verify" ? (
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950"
              >
                <ArrowLeft size={16} />
                Edit registration details
              </button>
            ) : mode === "forgot" ? (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950"
              >
                <ArrowLeft size={16} />
                Back to login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950"
              >
                <ArrowLeft size={16} />
                Edit email address
              </button>
            )}

            {statusMessage ? (
              <div className="mb-5 flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <fieldset className="grid grid-cols-2 gap-1 rounded-md bg-stone-100 p-1">
                  <legend className="sr-only">Login account type</legend>
                  {(["customer", "admin"] as const).map((audience) => (
                    <button
                      key={audience}
                      type="button"
                      onClick={() => setLoginAudience(audience)}
                      disabled={processing}
                      aria-pressed={loginAudience === audience}
                      className={`h-10 rounded text-xs font-bold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        loginAudience === audience
                          ? "bg-stone-950 text-white shadow-sm"
                          : "text-stone-500 hover:text-stone-950"
                      }`}
                    >
                      {audience === "admin" ? "Admin" : "Customer"}
                    </button>
                  ))}
                </fieldset>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <Mail size={14} />
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <KeyRound size={14} />
                    Password
                  </span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Enter your password"
                    className={inputClass}
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-sm font-semibold text-stone-500 transition hover:text-stone-950"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Sign in as {loginAudience}
                </button>
              </form>
            ) : null}

            {mode === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <Mail size={14} />
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={forgotForm.email}
                    onChange={(event) =>
                      setForgotForm({
                        email: event.target.value,
                      })
                    }
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </label>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Send OTP
                </button>
              </form>
            ) : null}

            {mode === "reset" ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <Mail size={14} />
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={resetForm.email}
                    onChange={(event) =>
                      setResetForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <KeyRound size={14} />
                    OTP code
                  </span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={resetForm.otp}
                    onChange={(event) =>
                      setResetForm((current) => ({
                        ...current,
                        otp: event.target.value,
                      }))
                    }
                    placeholder="123456"
                    className={`${inputClass} text-center text-lg font-semibold tracking-[0.45em]`}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <KeyRound size={14} />
                    New password
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={resetForm.newPassword}
                    onChange={(event) =>
                      setResetForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <KeyRound size={14} />
                    Confirm password
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={resetForm.confirmPassword}
                    onChange={(event) =>
                      setResetForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Repeat your new password"
                    className={inputClass}
                  />
                </label>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Reset password
                </button>
              </form>
            ) : null}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <UserRound size={14} />
                    Full name
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={registerForm.fullName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Enter your fullname"
                    className={inputClass}
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                      <Mail size={14} />
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="name@example.com"
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                      <Phone size={14} />
                      Phone
                    </span>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Enter your phone number"
                      className={inputClass}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <MapPin size={14} />
                    Address
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="street-address"
                    value={registerForm.address}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="123 Duong Song Hanh, Quan 2"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <KeyRound size={14} />
                    Password
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </label>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Send OTP
                </button>
              </form>
            ) : null}

            {mode === "verify" ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <Mail size={14} />
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={verifyForm.email}
                    onChange={(event) =>
                      setVerifyForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    <KeyRound size={14} />
                    OTP code
                  </span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verifyForm.otp}
                    onChange={(event) =>
                      setVerifyForm((current) => ({
                        ...current,
                        otp: event.target.value,
                      }))
                    }
                    placeholder="123456"
                    className={`${inputClass} text-center text-lg font-semibold tracking-[0.45em]`}
                  />
                </label>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Verify account
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
