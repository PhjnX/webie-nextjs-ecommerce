"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { useState } from "react";

type PaymentResult = "success" | "failed";

interface PaymentResultDialogProps {
  orderId: string;
  result: string;
}

function normalizePaymentResult(result: string): PaymentResult | null {
  if (result === "success" || result === "failed") {
    return result;
  }

  return null;
}

export default function PaymentResultDialog({
  orderId,
  result,
}: PaymentResultDialogProps) {
  const router = useRouter();
  const paymentResult = normalizePaymentResult(result);
  const paymentKey = paymentResult ? `${paymentResult}:${orderId}` : "";
  const [dismissedPaymentKey, setDismissedPaymentKey] = useState("");
  const open = Boolean(paymentResult) && dismissedPaymentKey !== paymentKey;
  const isSuccess = paymentResult === "success";

  if (!paymentResult || !open) {
    return null;
  }

  const handleClose = () => {
    setDismissedPaymentKey(paymentKey);
    router.replace("/", { scroll: false });
  };

  const orderHref = orderId
    ? `/profile/orders/${encodeURIComponent(orderId)}`
    : "/profile?section=orders";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 px-4 py-8 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-result-title"
        className="relative w-full max-w-md rounded-lg bg-white p-7 text-center shadow-2xl shadow-stone-950/25"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
          aria-label="Close payment message"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-9 w-9" />
          ) : (
            <XCircle className="h-9 w-9" />
          )}
        </div>

        <h2
          id="payment-result-title"
          className="mt-5 text-2xl font-semibold text-stone-950"
        >
          {isSuccess ? "Payment successful" : "Payment not confirmed"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {isSuccess
            ? "Thank you. Your order payment was completed successfully and the order can no longer be paid again."
            : "VNPay returned without a confirmed payment. Please review your order before trying again."}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-12 items-center justify-center rounded-md border border-stone-200 px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
          >
            Stay on home
          </button>
          <Link
            href={orderHref}
            className="flex h-12 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-[#916061]"
          >
            View order
          </Link>
        </div>
      </section>
    </div>
  );
}
