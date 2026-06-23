"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import AuthDialog from "@/app/components/auth/AuthDialog";
import Footer from "@/app/components/Footer";
import { useStoredAuthSession } from "@/app/components/auth/useStoredAuthSession";
import {
  getAuthSessionAdminAccess,
  logoutAccount,
  type AuthSession,
} from "@/services/auth";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
  },
];

function isExplicitlyNonAdmin(session: AuthSession | null) {
  return getAuthSessionAdminAccess(session) === false;
}

function getAccountLabel(session: AuthSession | null) {
  return (
    session?.fullName ||
    (typeof session?.user?.fullName === "string" ? session.user.fullName : "") ||
    (typeof session?.user?.name === "string" ? session.user.name : "") ||
    session?.email ||
    "Admin"
  );
}

function getSessionAvatarUrl(session: AuthSession | null) {
  const user = session?.user;

  if (!user) {
    return "";
  }

  const avatarValue = [
    user.avatarUrl,
    user.avatar_url,
    user.avatar,
    user.imageUrl,
    user.image_url,
  ].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  return avatarValue?.trim() ?? "";
}

function getInitials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A"
  );
}

function AdminNav({
  onNavigate,
  pathname,
  mobile = false,
}: {
  onNavigate?: () => void;
  pathname: string;
  mobile?: boolean;
}) {
  return (
    <nav
      className={
        mobile
          ? "flex flex-col gap-2"
          : "hidden items-center justify-center gap-10 lg:flex"
      }
    >
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center text-[15px] font-semibold uppercase tracking-[0.12em] transition ${
              active
                ? "text-[#746f35]"
                : "text-stone-950 hover:text-[#746f35]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const {
    authSession,
    clearSession,
    persistSession,
    sessionReady,
  } = useStoredAuthSession();
  const accountLabel = getAccountLabel(authSession);
  const avatarUrl = getSessionAvatarUrl(authSession);

  const handleAuthenticated = (session: AuthSession) => {
    persistSession(session);
    setAuthDialogOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logoutAccount();
    } catch {
      // Local logout should still clear an expired or already-revoked session.
    } finally {
      clearSession();
      setLoggingOut(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading admin
        </div>
      </div>
    );
  }

  if (!authSession) {
    return (
      <>
        <section className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
          <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-white">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-stone-950">
              Admin access required
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              Sign in with an administrator account to continue.
            </p>
            <button
              type="button"
              onClick={() => setAuthDialogOpen(true)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Sign in
            </button>
          </div>
        </section>
        <AuthDialog
          open={authDialogOpen}
          session={authSession}
          defaultLoginAudience="admin"
          onClose={() => setAuthDialogOpen(false)}
          onAuthenticated={handleAuthenticated}
          onLogout={clearSession}
        />
      </>
    );
  }

  if (isExplicitlyNonAdmin(authSession)) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-stone-950">
            Administrator role required
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            This account is signed in, but it is not marked as an admin account.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-stone-200 px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-100"
          >
            Sign out
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f8fc] text-stone-950">
      <header className="sticky top-0 z-30 border-b border-[#d8d2c7] bg-white">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 md:min-h-24 md:px-10">
          <Link href="/admin" className="flex min-w-0 items-center">
            <div className="relative flex h-22 w-32 items-center md:w-25">
              <Image
                  src="/images/webie-logo.png"
                  alt="Webie Logo"
                  fill
                  sizes="(max-width: 768px) 128px, 100px"
                  className="object-contain object-left"
                  priority
              />
            </div>
            <span className="min-w-0 leading-none">
              <span className="block text-2xl font-extrabold tracking-tight text-[#55512d] md:text-3xl">
                Webie E-Commerce
              </span>
              <span className="mt-1 block text-sm font-medium text-stone-500 md:text-base">
                Admin Portal
              </span>
            </span>
          </Link>

          <AdminNav pathname={pathname} />

          <div className="flex items-center gap-3">
            <div className="hidden h-12 w-px bg-[#c9c1b3] md:block" />
            <div className="hidden min-w-0 text-right md:block">
              <p className="truncate text-base font-semibold text-stone-950">
                {accountLabel}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
                Administrator
              </p>
            </div>
            <span
              className="hidden h-12 w-12 flex-none items-center justify-center rounded-full border-2 border-[#e9dc7c] bg-stone-100 bg-cover bg-center text-sm font-bold text-stone-700 md:flex"
              style={
                avatarUrl
                  ? { backgroundImage: `url(${JSON.stringify(avatarUrl)})` }
                  : undefined
              }
              aria-hidden="true"
            >
              {avatarUrl ? null : getInitials(accountLabel)}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
              title="Sign out"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 lg:hidden"
              aria-label="Toggle admin navigation"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-stone-200 px-5 py-4 lg:hidden">
            <AdminNav
              pathname={pathname}
              mobile
              onNavigate={() => setMobileNavOpen(false)}
            />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-stone-200 bg-white text-sm font-semibold text-stone-600"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
              Sign out
            </button>
          </div>
        ) : null}
      </header>

      <main className="flex-1 px-4 py-10 md:px-10 md:py-14">{children}</main>
      <Footer />
    </div>
  );
}
