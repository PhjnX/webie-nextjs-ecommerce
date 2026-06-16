"use client";

import {
  CheckCircle2,
  Home,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  Upload,
  UserCircle,
  UserRound,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AuthDialog from "@/app/components/auth/AuthDialog";
import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_SESSION_UPDATED_EVENT,
  logoutAccount,
  type AuthSession,
} from "@/services/auth";
import {
  changeUserPassword,
  getUserProfile,
  syncStoredAuthSession,
  updateUserProfile,
  uploadUserAvatar,
  UserApiError,
  type UserProfile,
} from "@/services/user";

const inputClass =
  "h-14 w-full rounded-lg border border-[#d1c8b9] bg-white py-0 pl-12 pr-4 text-base text-[#171d2a] outline-none transition placeholder:text-[#7a8292] focus:border-[#7d7438] focus:ring-2 focus:ring-[#d8c97b]/35";
const fieldLabelClass =
  "mb-2 block text-sm font-semibold uppercase text-[#4e4a42]";
const fieldIconClass =
  "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#797466]";
const panelClass =
  "rounded-lg border border-[#cfc7b8] bg-white p-6 shadow-[0_20px_60px_rgba(34,43,69,0.06)] md:p-8";
const sidebarCardClass =
  "rounded-lg border border-[#cfc7b8] bg-white shadow-[0_18px_44px_rgba(34,43,69,0.08)]";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected profile error.";
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();

  if (!source) {
    return "U";
  }

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function readStoredSession() {
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

export default function ProfilePage() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authSession, setAuthSession] =
    useState<AuthSession | null>(readStoredSession);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = profile?.fullName || "Your profile";
  const displayEmail = profile?.email || authSession?.email || "";
  const initials = useMemo(
    () => getInitials(displayName, displayEmail),
    [displayEmail, displayName],
  );

  const applyProfile = useCallback((nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setProfileForm({
      fullName: nextProfile.fullName,
      phone: nextProfile.phone,
      address: nextProfile.address,
    });
    setAvatarPreview(nextProfile.avatarUrl ?? "");
    syncStoredAuthSession(nextProfile);
    setAuthSession(readStoredSession());
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const nextProfile = await getUserProfile();

      applyProfile(nextProfile);
      setAuthDialogOpen(false);
    } catch (error) {
      setProfile(null);

      if (error instanceof UserApiError && error.status === 401) {
        setAuthDialogOpen(true);
      } else {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    const profileLoadId = window.setTimeout(loadProfile, 0);

    return () => {
      window.clearTimeout(profileLoadId);
    };
  }, [loadProfile]);

  const handleAuthenticated = (session: AuthSession) => {
    setAuthSession(session);
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
    setAuthDialogOpen(false);
    loadProfile();
  };

  const handleLogout = () => {
    setAuthSession(null);
    setProfile(null);
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT));
    setAuthDialogOpen(true);
  };

  const handleProfileLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await logoutAccount();
    } catch {
      // Keep local logout behavior consistent even if the remote session has already expired.
    } finally {
      handleLogout();
      setLoggingOut(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    setSavingProfile(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const payload = {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
      };
      const result = await updateUserProfile(payload);
      const nextProfile = {
        ...(profile ?? {
          email: authSession?.email ?? "",
          fullName: "",
          phone: "",
          address: "",
        }),
        ...result.profile,
        ...payload,
        email: result.profile.email || profile?.email || authSession?.email || "",
      };

      applyProfile(nextProfile);
      setStatusMessage(result.message || "Profile updated successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedAvatar(file);
    setErrorMessage("");
    setStatusMessage("");

    if (!file) {
      setAvatarPreview(profile?.avatarUrl ?? "");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (uploadingAvatar || !selectedAvatar) {
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const result = await uploadUserAvatar(selectedAvatar);
      const nextProfile = {
        ...(profile ?? {
          email: authSession?.email ?? "",
          fullName: "",
          phone: "",
          address: "",
        }),
        ...result.profile,
      };

      setProfile(nextProfile);
      setAvatarPreview(result.profile.avatarUrl || avatarPreview);
      setSelectedAvatar(null);
      syncStoredAuthSession(nextProfile);
      setStatusMessage(result.message || "Avatar uploaded successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    setChangingPassword(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const message = await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStatusMessage(message || "Password changed successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const loginGate = (
    <section className="min-h-screen bg-white pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-white">
          <Lock size={22} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-stone-950">
          Sign in to view your profile
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone-500">
          Your profile is protected. Sign in and this page will open your
          account details automatically.
        </p>
        <button
          type="button"
          onClick={() => setAuthDialogOpen(true)}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-stone-950 px-6 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950"
        >
          Log in
        </button>
      </div>
    </section>
  );

  return (
    <>
      {loading ? (
        <section className="min-h-screen bg-white pt-28 pb-20 md:pt-32">
          <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-24">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading profile
            </div>
          </div>
        </section>
      ) : profile ? (
        <section className="min-h-screen bg-[##D6DAE5] pt-24 pb-16 text-[#171d2a] md:pt-28">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-5 sm:px-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:px-12 xl:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="space-y-7 lg:sticky lg:top-28">
              <form
                onSubmit={handleAvatarSubmit}
                className={`${sidebarCardClass} px-6 py-7`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div
                      className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-[#2c2d32] bg-cover bg-center text-4xl font-bold text-white"
                      style={
                        avatarPreview
                          ? { backgroundImage: `url("${avatarPreview}")` }
                          : undefined
                      }
                      aria-label="Profile avatar"
                    >
                      {avatarPreview ? null : initials}
                    </div>
                    <label className="absolute right-1 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#1d35d8] text-white shadow-lg transition hover:bg-[#1427a9]">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Choose avatar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <h2 className="mt-5 max-w-full text-2xl font-semibold leading-tight text-[#0f1624]">
                    {displayName}
                  </h2>
                  <p className="mt-2 max-w-full break-words text-sm font-medium text-[#747a8b]">
                    {displayEmail || "No email available"}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!selectedAvatar || uploadingAvatar}
                  className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#e8e4eb] px-5 text-sm font-semibold text-[#424353] transition hover:bg-[#ded8e4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Avatar
                </button>
              </form>

              <nav className={`${sidebarCardClass} overflow-hidden`}>
                <div
                  aria-current="page"
                  className="flex min-h-16 items-center gap-4 border-l-4 border-[#7b7134] bg-[#fff6b7] px-5 text-base font-semibold text-[#726832]"
                >
                  <UserRound className="h-5 w-5" />
                  Personal Info
                </div>
                <div className="flex min-h-16 items-center gap-4 border-t border-[#d7cfbe] px-5 text-base font-semibold text-[#4f4b43]">
                  <ShoppingBag className="h-5 w-5" />
                  Orders
                </div>
                <button
                  type="button"
                  onClick={handleProfileLogout}
                  disabled={loggingOut}
                  className="flex min-h-16 w-full items-center gap-4 border-t border-[#d7cfbe] px-5 text-left text-base font-semibold text-[#c02f23] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loggingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                  Log Out
                </button>
              </nav>
            </aside>

            <main>
              <header className="border-b border-[#cfc7b8] pb-8">
                <h1 className="text-5xl font-bold leading-none text-[#171d2a] sm:text-6xl lg:text-3xl">
                  Account Settings
                </h1>
                <p className="mt-5 max-w-5xl text-l leading-9 text-[#4f4b43]">
                  Manage your personal information, security preferences, and
                  account activity from a centralized dashboard.
                </p>
              </header>

              {statusMessage ? (
                <div className="mt-8 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-10 space-y-10">
                <form onSubmit={handleProfileSubmit} className={panelClass}>
                  <div className="mb-9 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-semibold leading-tight text-[#111827]">
                        Personal information
                      </h2>
                      <p className="mt-2 text-lg leading-7 text-[#4f4b43]">
                        Update the details used on your account for shipping and
                        billing.
                      </p>
                    </div>
                    <UserCircle className="mt-3 hidden h-9 w-9 text-[#c9c3b5] md:block" />
                  </div>

                  <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className={fieldLabelClass}>Email address</span>
                      <div className="relative">
                        <Mail className={fieldIconClass} aria-hidden="true" />
                        <input
                          type="email"
                          value={profile.email}
                          readOnly
                          className={`${inputClass} bg-white text-[#171d2a]`}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={fieldLabelClass}>Full name</span>
                      <div className="relative">
                        <UserRound
                          className={fieldIconClass}
                          aria-hidden="true"
                        />
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          value={profileForm.fullName}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              fullName: event.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={fieldLabelClass}>Phone</span>
                      <div className="relative">
                        <Phone className={fieldIconClass} aria-hidden="true" />
                        <input
                          type="tel"
                          required
                          autoComplete="tel"
                          value={profileForm.phone}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </label>

                    <label className="block md:col-span-2">
                      <span className={fieldLabelClass}>Address</span>
                      <div className="relative">
                        <Home className={fieldIconClass} aria-hidden="true" />
                        <input
                          type="text"
                          required
                          autoComplete="street-address"
                          value={profileForm.address}
                          onChange={(event) =>
                            setProfileForm((current) => ({
                              ...current,
                              address: event.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="mt-11 flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-[#746f35] px-8 text-base font-semibold uppercase text-white shadow-[0_8px_18px_rgba(72,67,30,0.24)] transition hover:bg-[#625d2b] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    Save Changes
                  </button>
                </form>

                <form onSubmit={handlePasswordSubmit} className={panelClass}>
                  <div className="mb-9 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-semibold leading-tight text-[#111827]">
                        Change password
                      </h2>
                      <p className="mt-2 text-lg leading-7 text-[#4f4b43]">
                        Use your current password to set a new, secure one.
                      </p>
                    </div>
                    <KeyRound className="mt-3 hidden h-9 w-9 text-[#c9c3b5] md:block" />
                  </div>

                  <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className={fieldLabelClass}>Current password</span>
                      <div className="relative">
                        <Lock className={fieldIconClass} aria-hidden="true" />
                        <input
                          type="password"
                          required
                          autoComplete="current-password"
                          value={passwordForm.currentPassword}
                          onChange={(event) =>
                            setPasswordForm((current) => ({
                              ...current,
                              currentPassword: event.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={fieldLabelClass}>New password</span>
                      <div className="relative">
                        <Lock className={fieldIconClass} aria-hidden="true" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={passwordForm.newPassword}
                          onChange={(event) =>
                            setPasswordForm((current) => ({
                              ...current,
                              newPassword: event.target.value,
                            }))
                          }
                          placeholder="Enter new password"
                          className={inputClass}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className={fieldLabelClass}>Confirm password</span>
                      <div className="relative">
                        <ShieldCheck
                          className={fieldIconClass}
                          aria-hidden="true"
                        />
                        <input
                          type="password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={passwordForm.confirmPassword}
                          onChange={(event) =>
                            setPasswordForm((current) => ({
                              ...current,
                              confirmPassword: event.target.value,
                            }))
                          }
                          placeholder="Confirm new password"
                          className={inputClass}
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="mt-11 flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-[#242b36] px-8 text-base font-semibold uppercase text-white shadow-[0_8px_18px_rgba(19,25,35,0.2)] transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {changingPassword ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                    Update Password
                  </button>
                </form>
              </div>
            </main>
          </div>
        </section>
      ) : (
        loginGate
      )}

      <AuthDialog
        open={authDialogOpen}
        session={authSession}
        onClose={() => setAuthDialogOpen(false)}
        onAuthenticated={handleAuthenticated}
        onLogout={handleLogout}
      />
    </>
  );
}
