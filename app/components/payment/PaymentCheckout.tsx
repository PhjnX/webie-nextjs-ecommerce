"use client";

// components/payment/PaymentCheckout.tsx
import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeHelp,
  CreditCard,
  Landmark,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type PaymentMethod = "card" | "paypal" | "bank";

const orderItems = [
  {
    id: 1,
    name: "Signature vCard 01",
    description: "Personalized Digital Identity",
    qty: 1,
    price: 245,
    image: "/images/services/website-templates.png",
  },
  {
    id: 2,
    name: "Personal Greeting Suite",
    description: "Custom Greeting Card Add-on",
    qty: 1,
    price: 85,
    image: "/images/services/personalized-greeting-cards.png",
  },
];

const inputClass =
  "h-14 w-full rounded-md border border-stone-200 bg-[#f8f5f4] px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:bg-white";

export default function PaymentCheckout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const totals = useMemo(() => {
    const subtotal = orderItems.reduce(
      (total, item) => total + item.price * item.qty,
      0,
    );
    const shipping = 18;
    const tax = 24.75;

    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (processing) {
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
        onSubmit={handleSubmit}
        className="mx-auto max-w-[1180px] px-6 lg:px-8"
      >
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-500">
            Cart <span className="mx-1 text-stone-300">&gt;</span> Information{" "}
            <span className="mx-1 text-stone-300">&gt;</span>{" "}
            <span className="text-stone-950">Review &amp; Payment</span>
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
            Finalize Your Order
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-stone-600">
            Review your personalized selections, add customer information, and
            choose a preferred payment method to complete your purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
          <div>
            <div className="mb-9 flex items-center gap-3 rounded-md bg-[#f7f0f0] px-5 py-4 text-sm font-semibold text-[#916061]">
              <Lock size={18} aria-hidden="true" />
              Secure Checkout Protocol Active
            </div>

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
                    placeholder="Elara Vance"
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
                    placeholder="elara.vance@studio.com"
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
                    placeholder="+1 555 0140"
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
                    placeholder="742 Heritage Oaks Lane"
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
                    placeholder="Savannah"
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
                    placeholder="United States"
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
            <h2 className="text-2xl font-semibold text-stone-950">
              Order Summary
            </h2>

            <div className="mt-7 space-y-5">
              {orderItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[86px_1fr] gap-4">
                  <div className="relative h-24 overflow-hidden rounded-md bg-stone-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="86px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-snug text-stone-950">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-stone-500">
                      {item.description}
                    </p>
                    <p className="mt-1 text-sm text-[#916061]">
                      Qty: {item.qty}
                    </p>
                    <p className="mt-2 text-sm font-bold text-stone-950">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-stone-200 pt-7">
              <div className="space-y-4 text-base text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-950">
                    ${totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (Express)</span>
                  <span className="text-stone-950">
                    ${totals.shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-stone-950">${totals.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-7 flex items-baseline justify-between border-t border-stone-200 pt-5">
                <span className="text-2xl font-semibold text-stone-950">
                  Total
                </span>
                <span className="text-3xl font-semibold text-stone-950">
                  ${totals.total.toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={processing}
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
    </section>
  );
}
