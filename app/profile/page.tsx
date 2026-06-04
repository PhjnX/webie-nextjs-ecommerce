"use client";

import {
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Upload,
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
  "h-12 w-full rounded-md border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#D8C97B] focus:ring-2 focus:ring-[#D8C97B]/20";

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
        <section className="min-h-screen bg-white pt-28 pb-20 md:pt-32">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mb-10 border-b border-stone-200 pb-8">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b39a42]">
                Account profile
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
                {displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-500">
                Manage your personal information, avatar, and password.
              </p>
            </div>

            {statusMessage ? (
              <div className="mb-6 flex gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
              <aside className="border border-stone-200 bg-white p-6 lg:sticky lg:top-28">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-stone-950 bg-cover bg-center text-4xl font-semibold text-white"
                    style={
                      avatarPreview
                        ? { backgroundImage: `url("${avatarPreview}")` }
                        : undefined
                    }
                    aria-label="Profile avatar"
                  >
                    {avatarPreview ? null : initials}
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-stone-950">
                    {displayName}
                  </h2>
                  <p className="mt-1 flex items-center justify-center gap-2 text-sm text-stone-500">
                    <Mail size={14} />
                    {displayEmail || "No email available"}
                  </p>
                </div>

                <form onSubmit={handleAvatarSubmit} className="mt-7 space-y-4">
                  <label className="block cursor-pointer rounded-md border border-dashed border-stone-300 p-4 text-center transition hover:border-[#D8C97B]">
                    <Camera className="mx-auto h-5 w-5 text-stone-500" />
                    <span className="mt-2 block text-sm font-semibold text-stone-700">
                      Choose avatar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={!selectedAvatar || uploadingAvatar}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    Upload avatar
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleProfileLogout}
                  disabled={loggingOut}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-stone-950 bg-white text-sm font-bold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-stone-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  Log out
                </button>
              </aside>

              <div className="space-y-10">
                <form
                  onSubmit={handleProfileSubmit}
                  className="border border-stone-200 bg-white p-6 md:p-8"
                >
                  <div className="mb-6 flex items-center justify-between gap-4 border-b border-stone-200 pb-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-stone-950">
                        Personal information
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        Update the details used on your account.
                      </p>
                    </div>
                    <UserRound className="hidden h-6 w-6 text-[#b39a42] md:block" />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                        <Mail size={14} />
                        Email address
                      </span>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className={`${inputClass} bg-stone-50 text-stone-500`}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                        <UserRound size={14} />
                        Full name
                      </span>
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
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                        <MapPin size={14} />
                        Address
                      </span>
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
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:px-7"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save changes
                  </button>
                </form>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="border border-stone-200 bg-white p-6 md:p-8"
                >
                  <div className="mb-6 flex items-center justify-between gap-4 border-b border-stone-200 pb-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-stone-950">
                        Change password
                      </h2>
                      <p className="mt-1 text-sm text-stone-500">
                        Use your current password to set a new one.
                      </p>
                    </div>
                    <KeyRound className="hidden h-6 w-6 text-[#b39a42] md:block" />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                        <KeyRound size={14} />
                        Current password
                      </span>
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
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
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
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#D8C97B] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:px-7"
                  >
                    {changingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound size={16} />
                    )}
                    Change password
                  </button>
                </form>
              </div>
            </div>
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
