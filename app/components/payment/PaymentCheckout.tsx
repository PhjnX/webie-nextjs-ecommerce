"use client";

// components/payment/PaymentCheckout.tsx
import Image from "next/image";
import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  BadgeHelp,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import AuthDialog from "@/app/components/auth/AuthDialog";
import { useStoredAuthSession } from "@/app/components/auth/useStoredAuthSession";
import { type AuthSession } from "@/services/auth";
import {
  type CartItem,
  CartApiError,
  clearCart,
  deleteCartItem,
  getCartItems,
  updateCartItemQuantity,
} from "@/services/cart";

type PaymentMethod = "card" | "paypal" | "bank";

const inputClass =
  "h-14 w-full rounded-md border border-stone-200 bg-[#f8f5f4] px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white";

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected cart error.";
}

function parseCartPrice(value: string) {
  const price = Number(value);

  return Number.isFinite(price) ? price : 0;
}

function getSessionValue(session: AuthSession | null, keys: string[]) {
  const user = session?.user;

  for (const key of keys) {
    const value =
      key === "email"
        ? session?.email
        : key === "fullName"
          ? session?.fullName
          : user?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export default function PaymentCheckout() {
  const {
    authSession,
    clearSession,
    persistSession,
    sessionReady,
  } = useStoredAuthSession();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(
    null,
  );
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const loadCart = useCallback(async () => {
    if (!sessionReady) {
      return;
    }

    if (!authSession) {
      setCartItems([]);
      setCartLoading(false);
      setAuthDialogOpen(true);
      return;
    }

    setCartLoading(true);
    setCartError("");

    try {
      const items = await getCartItems();

      setCartItems(items);
    } catch (error) {
      if (error instanceof CartApiError && error.status === 401) {
        clearSession();
        setAuthDialogOpen(true);
      } else {
        setCartError(getErrorMessage(error));
      }
    } finally {
      setCartLoading(false);
    }
  }, [authSession, clearSession, sessionReady]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadCart();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadCart]);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (total, item) =>
        total + parseCartPrice(item.productPrice) * item.quantity,
      0,
    );
    const quantity = cartItems.reduce((total, item) => total + item.quantity, 0);

    return {
      quantity,
      subtotal,
      total: subtotal,
    };
  }, [cartItems]);

  const customerDefaults = useMemo(
    () => ({
      address: getSessionValue(authSession, ["address"]),
      email: getSessionValue(authSession, ["email"]),
      fullName: getSessionValue(authSession, ["fullName", "name"]),
      phone: getSessionValue(authSession, [
        "phone",
        "phoneNumber",
        "phone_number",
      ]),
    }),
    [authSession],
  );

  const handleAuthenticated = (session: AuthSession) => {
    persistSession(session);
  };

  const handleLogout = () => {
    clearSession();
    setCartItems([]);
    setAuthDialogOpen(true);
  };

  const handleClearCart = async () => {
    if (clearing) {
      return;
    }

    setClearing(true);
    setCartError("");
    setStatusMessage("");

    try {
      const message = await clearCart();

      setCartItems([]);
      setStatusMessage(message || "Cart cleared successfully.");
    } catch (error) {
      if (error instanceof CartApiError && error.status === 401) {
        clearSession();
        setAuthDialogOpen(true);
      } else {
        setCartError(getErrorMessage(error));
      }
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteCartItem = async (id: number) => {
    if (deletingItemId === id || updatingItemId === id) {
      return;
    }

    setDeletingItemId(id);
    setCartError("");
    setStatusMessage("");

    try {
      const result = await deleteCartItem(id);

      setCartItems((currentItems) =>
        result.items.length > 0
          ? result.items
          : currentItems.filter((item) => item.id !== id),
      );
      setStatusMessage(result.message || "Cart item removed successfully.");
    } catch (error) {
      if (error instanceof CartApiError && error.status === 401) {
        clearSession();
        setAuthDialogOpen(true);
      } else {
        setCartError(getErrorMessage(error));
      }
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleUpdateCartItemQuantity = async (
    item: CartItem,
    nextQuantity: number,
  ) => {
    if (updatingItemId === item.id || deletingItemId === item.id) {
      return;
    }

    if (nextQuantity <= 0) {
      await handleDeleteCartItem(item.id);
      return;
    }

    setUpdatingItemId(item.id);
    setCartError("");
    setStatusMessage("");

    try {
      const result = await updateCartItemQuantity(item.id, nextQuantity);

      setCartItems((currentItems) =>
        result.items.length > 0
          ? result.items
          : currentItems.map((currentItem) =>
              currentItem.id === item.id
                ? { ...currentItem, quantity: nextQuantity }
                : currentItem,
            ),
      );
      setStatusMessage(
        result.message || "Cart item quantity updated successfully.",
      );
    } catch (error) {
      if (error instanceof CartApiError && error.status === 401) {
        clearSession();
        setAuthDialogOpen(true);
      } else {
        setCartError(getErrorMessage(error));
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
      return;
    }

    if (!authSession) {
      setAuthDialogOpen(true);
      return;
    }

    if (cartItems.length === 0) {
      setStatusMessage("Your cart is empty.");
      return;
    }

    setProcessing(true);
    setStatusMessage("");

    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    setProcessing(false);
    setStatusMessage(
      "Payment details captured. Your order is ready for processing.",
    );
  };

  return (
    <section className="min-h-screen bg-white pt-28 pb-20 md:pt-32">
      <form
        key={authSession?.email ?? "guest"}
        onSubmit={handleSubmit}
        className="mx-auto max-w-[1180px] px-6 lg:px-8"
      >
        <div className="mb-12">
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
            Finalize Your Order
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-stone-600">
            Review your cart items, confirm customer information, and choose a
            payment method to complete your purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
          <div>
            <div className="mb-9 flex items-center gap-3 rounded-md bg-[#f7f0f0] px-5 py-4 text-sm font-semibold text-[#916061]">
              <Lock size={18} aria-hidden="true" />
              Secure Checkout Protocol Active
            </div>

            {!authSession && sessionReady ? (
              <section className="mb-9 rounded-lg border border-stone-200 bg-stone-50 p-6">
                <h2 className="text-2xl font-semibold text-stone-950">
                  Sign in to view your cart
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Cart details are connected to your account.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthDialogOpen(true)}
                  className="mt-5 h-12 rounded-md bg-stone-950 px-5 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#916061]"
                >
                  Log in
                </button>
              </section>
            ) : null}

            <section className="border-b border-stone-100 pb-9">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-stone-950">
                  Customer Details
                </h2>
                <span className="text-sm font-medium text-[#916061]">
                  Required
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    defaultValue={customerDefaults.fullName}
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={customerDefaults.email}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    defaultValue={customerDefaults.phone}
                    placeholder="+84 900 000 000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    Billing address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    required
                    defaultValue={customerDefaults.address}
                    placeholder="Enter your billing address"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    placeholder="Ho Chi Minh City"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="country"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    autoComplete="country-name"
                    required
                    placeholder="Vietnam"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="pt-9">
              <h2 className="text-2xl font-semibold text-stone-950">
                Payment Method
              </h2>

              <div className="mt-6 space-y-4">
                <label className="block cursor-pointer rounded-xl border border-stone-950 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="h-4 w-4 accent-[#916061]"
                    />
                    <span className="text-sm font-bold text-stone-950">
                      Credit Card
                    </span>
                    <CreditCard size={17} className="text-stone-600" />
                  </div>

                  {paymentMethod === "card" ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="relative md:col-span-2">
                        <input
                          name="cardNumber"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          required
                          placeholder="Card Number"
                          className={`${inputClass} pr-12`}
                        />
                        <BadgeHelp
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                          aria-hidden="true"
                        />
                      </div>
                      <input
                        name="expiry"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        required
                        placeholder="MM / YY"
                        className={inputClass}
                      />
                      <input
                        name="cvc"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        required
                        placeholder="CVC"
                        className={inputClass}
                      />
                      <input
                        name="cardholder"
                        type="text"
                        autoComplete="cc-name"
                        required
                        placeholder="Cardholder Name"
                        className={`${inputClass} md:col-span-2`}
                      />
                    </div>
                  ) : null}
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-white p-6 transition hover:border-stone-300">
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className="h-4 w-4 accent-[#916061]"
                    />
                    <span className="text-sm font-bold text-stone-950">
                      PayPal
                    </span>
                  </span>
                  <Wallet size={20} className="text-stone-600" />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-100 bg-white p-6 transition hover:border-stone-300">
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={() => setPaymentMethod("bank")}
                      className="h-4 w-4 accent-[#916061]"
                    />
                    <span className="text-sm font-bold text-stone-950">
                      Bank Transfer
                    </span>
                  </span>
                  <Landmark size={20} className="text-stone-600" />
                </label>
              </div>
            </section>
          </div>

          <aside className="rounded-2xl bg-[#f8f3f2] p-8 shadow-xl shadow-stone-200/50 lg:sticky lg:top-28">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-stone-950">
                  Order Summary
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {totals.quantity} item{totals.quantity === 1 ? "" : "s"}
                </p>
              </div>
              {cartItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={clearing}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Clear cart"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                </button>
              ) : null}
            </div>

            <div className="mt-7 space-y-5">
              {cartLoading ? (
                <div className="flex items-center gap-3 rounded-md bg-white px-4 py-5 text-sm font-medium text-stone-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cart...
                </div>
              ) : cartError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                  {cartError}
                </div>
              ) : cartItems.length === 0 ? (
                <div className="rounded-md border border-stone-200 bg-white px-4 py-7 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-stone-400" />
                  <h3 className="mt-3 text-base font-semibold text-stone-950">
                    Your cart is empty
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-stone-500">
                    Add a product before checkout.
                  </p>
                  <Link
                    href="/products"
                    className="mt-5 inline-flex h-11 items-center rounded-md bg-stone-950 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#916061]"
                  >
                    Browse products
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => {
                  const itemTotal =
                    parseCartPrice(item.productPrice) * item.quantity;
                  const itemBusy =
                    deletingItemId === item.id || updatingItemId === item.id;

                  return (
                    <div
                      key={`${item.id}-${item.productId}`}
                      className="grid grid-cols-[86px_1fr_32px] gap-4"
                    >
                      <div className="relative h-24 overflow-hidden rounded-md bg-stone-100">
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName}
                          fill
                          sizes="86px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold leading-snug text-stone-950">
                          {item.productName}
                        </h3>
                        {item.productSku ? (
                          <p className="mt-1 text-xs uppercase tracking-wide text-stone-400">
                            SKU: {item.productSku}
                          </p>
                        ) : null}
                        <div className="mt-3 inline-flex h-9 items-center overflow-hidden rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-800">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCartItemQuantity(
                                item,
                                item.quantity - 1,
                              )
                            }
                            disabled={itemBusy}
                            className="flex h-full w-9 items-center justify-center text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Decrease ${item.productName} quantity`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="flex min-w-9 items-center justify-center border-x border-stone-200 px-2">
                            {updatingItemId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCartItemQuantity(
                                item,
                                item.quantity + 1,
                              )
                            }
                            disabled={itemBusy}
                            className="flex h-full w-9 items-center justify-center text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Increase ${item.productName} quantity`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm font-bold text-stone-950">
                          {priceFormatter.format(itemTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCartItem(item.id)}
                        disabled={itemBusy}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        {deletingItemId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-8 border-t border-stone-200 pt-7">
              <div className="space-y-4 text-base text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-950">
                    {priceFormatter.format(totals.subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-7 flex items-baseline justify-between border-t border-stone-200 pt-5">
                <span className="text-2xl font-semibold text-stone-950">
                  Total
                </span>
                <span className="text-3xl font-semibold text-stone-950">
                  {priceFormatter.format(totals.total)}
                </span>
              </div>

              <button
                type="submit"
                disabled={processing || cartLoading || cartItems.length === 0}
                className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-stone-900 text-sm font-bold text-white transition hover:bg-[#916061] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processing ? "Processing..." : "Place Order"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
                <ShieldCheck size={14} aria-hidden="true" />
                Secure payment processing enabled
              </div>

              <p className="mt-4 min-h-5 text-center text-sm font-medium text-[#916061]">
                {statusMessage}
              </p>
            </div>
          </aside>
        </div>
      </form>

      <AuthDialog
        open={authDialogOpen}
        session={authSession}
        onClose={() => setAuthDialogOpen(false)}
        onAuthenticated={handleAuthenticated}
        onLogout={handleLogout}
      />
    </section>
  );
}
