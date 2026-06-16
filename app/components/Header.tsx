"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import AuthDialog from "./auth/AuthDialog";
import { useStoredAuthSession } from "./auth/useStoredAuthSession";
import { type AuthSession } from "@/services/auth";
import {
  CART_UPDATED_EVENT,
  CartApiError,
  getCartItems,
} from "@/services/cart";

const productCategories = [
  {
    name: "Greeting Cards",
    desc: "Personalized artistic greeting cards",
    href: "/products",
  },
  {
    name: "Website Templates",
    desc: "SEO-ready professional website templates",
    href: "/products",
  },
  {
    name: "App Templates",
    desc: "UI kits and mobile app starter templates",
    href: "/products",
  },
];

const PROFILE_SETTINGS_PATH = "/profile?section=settings";
const PROFILE_CARD_PATH = "/profile?section=card";

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

function AccountAvatar({
  avatarUrl,
  iconSize = 20,
}: {
  avatarUrl: string;
  iconSize?: number;
}) {
  if (!avatarUrl) {
    return <User size={iconSize} />;
  }

  return (
    <span
      className="block h-8 w-8 rounded-full border border-stone-200 bg-stone-100 bg-cover bg-center shadow-sm"
      style={{ backgroundImage: `url(${JSON.stringify(avatarUrl)})` }}
      aria-hidden="true"
    />
  );
}

export default function Header() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(
    null,
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const {
    authSession,
    clearSession,
    persistSession,
    sessionReady,
  } = useStoredAuthSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (!authSession) {
      const resetCartCountId = window.setTimeout(() => {
        setCartItemCount(0);
      }, 0);

      return () => {
        window.clearTimeout(resetCartCountId);
      };
    }

    let cancelled = false;

    const loadCartCount = async () => {
      try {
        const items = await getCartItems();

        if (cancelled) {
          return;
        }

        setCartItemCount(
          items.reduce((total, item) => total + item.quantity, 0),
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof CartApiError && error.status === 401) {
          setCartItemCount(0);
          clearSession();
        }
      }
    };

    const handleCartUpdated = () => {
      void loadCartCount();
    };

    void loadCartCount();
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    };
  }, [authSession, clearSession, sessionReady]);

  const openAuthDialog = (redirectPath: string | null = null) => {
    setMobileOpen(false);
    setRedirectAfterLogin(redirectPath);
    setAuthDialogOpen(true);
  };

  const handleCartClick = () => {
    setMobileOpen(false);

    if (!authSession) {
      openAuthDialog(PROFILE_CARD_PATH);
      return;
    }

    router.push(PROFILE_CARD_PATH);
  };

  const handleAuthenticated = (session: AuthSession) => {
    persistSession(session);

    if (redirectAfterLogin) {
      const nextPath = redirectAfterLogin;

      setRedirectAfterLogin(null);
      router.push(nextPath);
    }
  };

  const handleLogout = () => {
    setRedirectAfterLogin(null);
    clearSession();
  };

  const accountLabel = authSession?.fullName || authSession?.email || "Sign in";
  const avatarUrl = getSessionAvatarUrl(authSession);
  const cartItemCountLabel = cartItemCount > 99 ? "99+" : String(cartItemCount);
  const cartAriaLabel =
    cartItemCount > 0
      ? `Shopping cart and payment, ${cartItemCount} item${
          cartItemCount === 1 ? "" : "s"
        }`
      : "Shopping cart and payment";

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-45 h-20 transition-all duration-350 ${
          isScrolled
            ? "border-b border-stone-100 bg-white/95 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex h-full items-center">
            <div className="relative flex h-22 w-32 items-center md:w-36">
              <Image
                src="/images/logo.png"
                alt="Webie Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <nav className="hidden h-full items-center gap-3 md:flex">
            <Link
              href="/"
              className="px-3 py-2 text-[13px] font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-[#D8C97B]"
            >
              Home
            </Link>
            <Link
              href="/#services"
              className="px-3 py-2 text-[13px] font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-[#D8C97B]"
            >
              Services
            </Link>
            <Link
              href="/#AboutUs"
              className="px-3 py-2 text-[13px] font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-[#D8C97B]"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 text-[13px] font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-[#D8C97B]"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="group relative">
              {authSession ? (
                <Link
                  href={PROFILE_SETTINGS_PATH}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-all duration-200 hover:bg-stone-50/50 hover:text-[#D8C97B]"
                  aria-label="Profile settings"
                >
                  <AccountAvatar avatarUrl={avatarUrl} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthDialog(PROFILE_SETTINGS_PATH)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-all duration-200 hover:bg-stone-50/50 hover:text-[#D8C97B]"
                  aria-label="Account"
                >
                  <User size={20} />
                </button>
              )}

              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
                {accountLabel}
              </div>
            </div>

            <div className="h-5 w-px bg-stone-200/50" />

            <button
              type="button"
              onClick={handleCartClick}
              aria-label={cartAriaLabel}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-all duration-200 hover:bg-stone-50/50 hover:text-[#D8C97B]"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D8C97B] px-1.5 text-[10px] font-bold leading-none text-stone-950 shadow-sm">
                  {cartItemCountLabel}
                </span>
              ) : null}
            </button>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-50 md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="flex flex-col gap-3 border-t border-stone-100 bg-white px-6 py-4 shadow-lg md:hidden">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm uppercase tracking-wider text-stone-600 transition-colors hover:text-[#D8C97B]"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm uppercase tracking-wider text-stone-600 transition-colors hover:text-[#D8C97B]"
            >
              Products
            </Link>
            {productCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                onClick={() => setMobileOpen(false)}
                className="py-1 pl-4 text-xs text-stone-600 transition-colors hover:text-[#D8C97B]"
              >
                - {category.name}
              </Link>
            ))}
            <Link
              href="/#AboutUs"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm uppercase tracking-wider text-stone-500 transition-colors hover:text-[#D8C97B]"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm uppercase tracking-wider text-stone-500 transition-colors hover:text-[#D8C97B]"
            >
              Contact
            </Link>

            <div className="flex gap-3 border-t border-stone-100 pt-4">
              {authSession ? (
                <Link
                  href={PROFILE_SETTINGS_PATH}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-stone-200 py-3 text-center text-xs font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-[#D8C97B]"
                >
                  <AccountAvatar avatarUrl={avatarUrl} iconSize={16} />
                  Profile
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthDialog(PROFILE_SETTINGS_PATH)}
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-stone-200 py-3 text-center text-xs font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:text-[#D8C97B]"
                >
                  <User size={16} />
                  Log in
                </button>
              )}
              <button
                type="button"
                onClick={handleCartClick}
                aria-label={cartAriaLabel}
                className="relative flex w-12 items-center justify-center rounded border border-stone-200 text-stone-600 transition-colors hover:text-[#D8C97B]"
              >
                <ShoppingCart size={20} />
                {cartItemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D8C97B] px-1.5 text-[10px] font-bold leading-none text-stone-950 shadow-sm">
                    {cartItemCountLabel}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        ) : null}
      </header>

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
