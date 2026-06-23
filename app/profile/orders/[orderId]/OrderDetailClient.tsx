"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthDialog from "@/app/components/auth/AuthDialog";
import { useStoredAuthSession } from "@/app/components/auth/useStoredAuthSession";
import { type AuthSession } from "@/services/auth";
import {
  createVnpayPayment,
  type CustomerOrder,
  formatOrderCurrency,
  formatOrderDate,
  getCustomerOrder,
  OrderApiError,
} from "@/services/order";
import { getUserProfile } from "@/services/user";

interface OrderDetailClientProps {
  orderId: string;
  paymentResult: string;
}

const steps = [
  {
    key: "ordered",
    label: "Ordered",
    icon: CheckCircle2,
    color: "from-lime-500 to-emerald-500",
  },
  {
    key: "paymented",
    label: "Paymented",
    icon: WalletCards,
    color: "from-amber-400 to-orange-500",
  },
  {
    key: "processing",
    label: "Processing",
    icon: Truck,
    color: "from-sky-400 to-blue-600",
  },
  {
    key: "completed",
    label: "Completed",
    icon: PackageCheck,
    color: "from-fuchsia-500 to-violet-600",
  },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected order error.";
}

function getOrderStageIndex(status: string) {
  const normalizedStatus = normalizeOrderStatus(status);

  if (["completed", "delivered", "done", "success"].includes(normalizedStatus)) {
    return 3;
  }

  if (["processing", "shipping", "in_progress"].includes(normalizedStatus)) {
    return 2;
  }

  if (
    [
      "pending",
      "unpaid",
      "waiting_payment",
      "paid",
      "paymented",
      "confirmed",
    ].includes(normalizedStatus)
  ) {
    return 1;
  }

  return 0;
}

function normalizeOrderStatus(status: string) {
  return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function canCreatePayment(status: string) {
  return ["pending", "unpaid", "waiting_payment"].includes(
    normalizeOrderStatus(status),
  );
}

function hasSuccessfulPayment(status: string) {
  return [
    "paid",
    "paymented",
    "payment_success",
    "success",
    "completed",
    "delivered",
    "processing",
    "confirmed",
  ].includes(
    normalizeOrderStatus(status),
  );
}

function getProgressScale(stageIndex: number) {
  if (stageIndex <= 0) {
    return 0;
  }

  return Math.min(1, stageIndex / (steps.length - 1));
}

function getInitialPaymentMessage(paymentResult: string) {
  if (paymentResult === "success") {
    return "VNPay returned successfully. Your order status was refreshed.";
  }

  if (paymentResult === "failed") {
    return "VNPay returned without a confirmed payment.";
  }

  return "";
}

function readSessionUserString(
  session: AuthSession | null,
  keys: string[],
) {
  const user = session?.user;

  if (!user) {
    return "";
  }

  for (const key of keys) {
    const value = user[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

export default function OrderDetailClient({
  orderId,
  paymentResult,
}: OrderDetailClientProps) {
  const {
    authSession,
    clearSession,
    persistSession,
    sessionReady,
  } = useStoredAuthSession();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(() =>
    getInitialPaymentMessage(paymentResult),
  );
  const [profileAddress, setProfileAddress] = useState("");

  const loadOrder = useCallback(async () => {
    if (!sessionReady) {
      return;
    }

    if (!authSession) {
      setOrder(null);
      setLoading(false);
      setAuthDialogOpen(true);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const nextOrder = await getCustomerOrder(orderId);

      setOrder(nextOrder);
      try {
        const profile = await getUserProfile();

        setProfileAddress(profile.address);
      } catch {
        setProfileAddress("");
      }
    } catch (error) {
      setOrder(null);

      if (error instanceof OrderApiError && error.status === 401) {
        clearSession();
        setAuthDialogOpen(true);
      } else {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, [authSession, clearSession, orderId, sessionReady]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadOrder]);

  const orderStageIndex = useMemo(
    () => getOrderStageIndex(order?.status ?? "pending"),
    [order?.status],
  );
  const subtotal = useMemo(
    () =>
      order?.items.reduce((total, item) => total + item.subtotal, 0) ??
      order?.totalAmount ??
      0,
    [order],
  );
  const customerAddress =
    order?.customerAddress ||
    profileAddress ||
    readSessionUserString(authSession, [
      "address",
      "streetAddress",
      "street_address",
      "customerAddress",
      "customer_address",
    ]);

  const handleAuthenticated = (session: AuthSession) => {
    persistSession(session);
    void loadOrder();
  };

  const handleCreatePayment = async () => {
    if (!order || paying) {
      return;
    }

    if (!canCreatePayment(order.status)) {
      setPaymentMessage(
        hasSuccessfulPayment(order.status)
          ? "This order has already been paid successfully and cannot be paid again."
          : "Payment is not available for this order.",
      );
      return;
    }

    setPaying(true);
    setErrorMessage("");
    setPaymentMessage("");

    try {
      const result = await createVnpayPayment(order.id);

      if (result.paymentUrl) {
        setPaymentMessage("Redirecting to VNPay...");
        window.location.assign(result.paymentUrl);
        return;
      }

      setPaymentMessage(
        result.message || "VNPay payment was created, but no redirect URL was returned.",
      );
    } catch (error) {
      if (error instanceof OrderApiError && error.status === 401) {
        clearSession();
        setAuthDialogOpen(true);
      } else {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f7f8fc] pt-28 pb-20 text-[#171d2a] md:pt-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <Link
          href="/profile?section=orders"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[#d8d2c7] bg-white px-4 text-sm font-semibold text-[#4f4b43] shadow-sm transition hover:border-[#746f35] hover:text-[#746f35]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        {loading ? (
          <div className="mt-14 flex items-center gap-3 rounded-lg border border-[#d1c8b9] bg-white px-6 py-8 text-sm font-semibold text-[#4f4b43]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading order detail...
          </div>
        ) : errorMessage ? (
          <div className="mt-14 rounded-lg border border-red-200 bg-red-50 px-6 py-6 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : !order ? (
          <div className="mt-14 rounded-lg border border-[#d1c8b9] bg-white px-6 py-16 text-center">
            <PackageCheck className="mx-auto h-11 w-11 text-[#797466]" />
            <h1 className="mt-4 text-2xl font-bold text-[#111827]">
              Order not found
            </h1>
            <p className="mt-2 text-sm text-[#4f4b43]">
              This order could not be loaded from your account.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#746f35]">
                  Order Detail
                </p>
                <h1 className="mt-2 text-4xl font-bold leading-tight text-[#111827] md:text-5xl">
                  #ORD-{String(order.id).padStart(4, "0")}
                </h1>
                <p className="mt-3 text-base text-[#5f5b62]">
                  Created {formatOrderDate(order.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadOrder()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#242b36] px-5 text-sm font-semibold text-white shadow-lg shadow-stone-900/10 transition hover:bg-[#111827]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh status
              </button>
            </div>

            {paymentMessage ? (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
                {paymentMessage}
              </div>
            ) : null}

            <section className="mt-10 rounded-[28px] border border-white bg-white p-7 shadow-[0_24px_70px_rgba(38,48,87,0.08)] md:p-10">
              <div className="relative overflow-x-auto px-2 pb-2">
                <div className="relative min-w-[780px]">
                  <div className="absolute left-[12.5%] right-[12.5%] top-9 h-2 rounded-full bg-[#e7eaf3]" />
                  <div
                    className="absolute left-[12.5%] right-[12.5%] top-9 h-2 origin-left rounded-full bg-gradient-to-r from-lime-400 via-amber-400 to-blue-500 transition-transform"
                    style={{ transform: `scaleX(${getProgressScale(orderStageIndex)})` }}
                  />
                  <div className="relative grid grid-cols-4">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const reached = index <= orderStageIndex;
                      const current = index === orderStageIndex;

                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center text-center"
                        >
                          <div
                            className={`flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-xl transition ${
                              reached
                                ? `border-white bg-gradient-to-br ${step.color} text-white shadow-stone-300/50`
                                : "border-white bg-[#e8edf7] text-[#747a8b] shadow-stone-200/70"
                            } ${current ? "scale-110" : ""}`}
                          >
                            <StepIcon className="h-8 w-8" />
                          </div>
                          <p
                            className={`mt-4 text-base font-bold ${
                              reached ? "text-[#746f35]" : "text-[#747a8b]"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.85fr)] xl:items-start">
              <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(38,48,87,0.08)]">
                <div className="border-b border-[#d8d2c7] px-7 py-7 md:px-10">
                  <h2 className="text-3xl font-bold text-[#746f35]">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-6 px-7 py-8 md:px-10">
                  {order.items.length === 0 ? (
                    <div className="rounded-lg border border-[#d1c8b9] bg-[#f8f6ef] px-5 py-10 text-center text-sm font-semibold text-[#4f4b43]">
                      No product details were returned for this order.
                    </div>
                  ) : (
                    order.items.map((item) => (
                      <article
                        key={`${item.id}-${item.productId}`}
                        className="grid grid-cols-[92px_minmax(0,1fr)] gap-5 md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center"
                      >
                        <div className="relative h-[92px] w-[92px] overflow-hidden rounded-2xl bg-[#f1f2f6] md:h-[112px] md:w-[112px]">
                          <Image
                            src={item.productImageUrl}
                            alt={item.productName}
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold leading-snug text-[#171d2a]">
                            {item.productName}
                          </h3>
                          <p className="mt-1 text-sm text-[#6a6670]">
                            Quantity: {item.quantity}
                            {item.productSku ? ` | SKU: ${item.productSku}` : ""}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#746f35]">
                            {formatOrderCurrency(item.productPrice)}
                          </p>
                        </div>
                        <p className="text-left text-2xl font-bold text-[#746f35] md:text-right">
                          {formatOrderCurrency(item.subtotal)}
                        </p>
                      </article>
                    ))
                  )}

                  <div className="border-t border-[#d8d2c7] pt-7">
                    <div className="space-y-3 text-lg text-[#6a6670]">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-[#171d2a]">
                          {formatOrderCurrency(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span className="font-semibold text-[#746f35]">
                          Free
                        </span>
                      </div>
                    </div>
                    <div className="mt-7 flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-[#171d2a]">
                        Total
                      </span>
                      <span className="text-4xl font-bold text-[#746f35]">
                        {formatOrderCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-8">
                <section className="rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(38,48,87,0.08)] md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold uppercase tracking-[0.16em] text-[#5f5b62]">
                      Information
                    </h2>
                    <span className="rounded-full bg-[#f8f6ef] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#746f35]">
                      Customer
                    </span>
                  </div>

                  <div className="mt-7 space-y-7">
                    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-4">
                      <UserRound className="h-6 w-6 text-[#746f35]" />
                      <div>
                        <p className="font-bold text-[#171d2a]">Name</p>
                        <p className="mt-1 text-[#5f5b62]">
                          {order.customerName || "Not available"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-4">
                      <Mail className="h-6 w-6 text-[#746f35]" />
                      <div>
                        <p className="font-bold text-[#171d2a]">Email</p>
                        <p className="mt-1 break-words text-[#5f5b62]">
                          {order.customerEmail || "No email"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-4">
                      <Phone className="h-6 w-6 text-[#746f35]" />
                      <div>
                        <p className="font-bold text-[#171d2a]">Phone</p>
                        <p className="mt-1 text-[#5f5b62]">
                          {order.customerPhone || "No phone"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-4">
                      <MapPin className="h-6 w-6 text-[#746f35]" />
                      <div>
                        <p className="font-bold text-[#171d2a]">Address</p>
                        <p className="mt-1 text-[#5f5b62]">
                          {customerAddress || "No address"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(38,48,87,0.08)] md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold uppercase tracking-[0.16em] text-[#5f5b62]">
                      Payment Method
                    </h2>
                    <ShieldCheck className="h-7 w-7 text-[#746f35]" />
                  </div>

                  <div className="mt-6 rounded-2xl bg-[#eef3ff] p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[#d1c8b9] bg-white text-blue-700">
                        <CreditCard className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="font-bold text-[#171d2a]">
                          VNPay secure checkout
                        </p>
                        <p className="mt-1 text-sm text-[#5f5b62]">
                          {order.vnpayTxnRef
                            ? `Reference ${order.vnpayTxnRef}`
                            : "Vietnam domestic payment gateway"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {canCreatePayment(order.status) ? (
                    <button
                      type="button"
                      onClick={handleCreatePayment}
                      disabled={paying}
                      className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#746f35] via-[#a08c35] to-[#f2bf35] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-xl shadow-[#746f35]/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {paying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {paying ? "Creating payment..." : "Pay with VNPay"}
                    </button>
                  ) : (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800">
                      {hasSuccessfulPayment(order.status)
                        ? "This order has already been paid successfully and cannot be paid again."
                        : "Payment is not available for this order."}
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </>
        )}
      </div>

      <AuthDialog
        open={authDialogOpen}
        session={authSession}
        onClose={() => setAuthDialogOpen(false)}
        onAuthenticated={handleAuthenticated}
        onLogout={clearSession}
      />
    </section>
  );
}
