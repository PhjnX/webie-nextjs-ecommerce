"use client";

import { type FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";

type ContactSectionProps = {
  variant?: "home" | "page";
};

const fieldLabelClass =
  "mb-3 block text-xs font-semibold uppercase text-black";

const fieldControlClass =
  "h-14 w-full border border-[#3b372f] bg-[#E5E4E2] px-4 text-base text-black outline-none transition placeholder:text-stone-600 focus:border-[#d8c97b] focus:ring-1 focus:ring-[#d8c97b]";
const contactSuccessMessage =
  "Y\u00EAu c\u1EA7u t\u01B0 v\u1EA5n \u0111\u00E3 \u0111\u01B0\u1EE3c g\u1EEDi th\u00E0nh c\u00F4ng! Ch\u00FAng t\u00F4i s\u1EBD li\u00EAn h\u1EC7 b\u1EA1n trong v\u00F2ng 24 gi\u1EDD.";

const socialLinks = [
  { label: "LinkedIn", short: "LI", href: "https://www.linkedin.com" },
  { label: "Twitter", short: "TW", href: "https://twitter.com" },
  { label: "Instagram", short: "IG", href: "https://www.instagram.com" },
];

function ContactSection({ variant = "home" }: ContactSectionProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const form = event.currentTarget;
    const formValues = Object.fromEntries(new FormData(form).entries());

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to send your request.");
      }

      setSuccessMessage(payload?.message ?? contactSuccessMessage);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send your request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className={`bg-white px-4 pb-16 sm:px-6 lg:px-8 ${
        variant === "page" ? "pt-32 md:pt-36" : "pt-16 md:pt-20"
      }`}
    >
      <div className="mx-auto max-w-[1040px]">
        <div className="text-center">
          <h2 className="mx-auto mt-8 max-w-[860px] text-4xl font-bold leading-tight text-stone-950 sm:text-5xl lg:text-6xl">
            Register for a{" "}
            <span className="italic text-[#b9a45b]">consultation</span>
          </h2>

          <p className="mx-auto mt-5 max-w-[660px] text-base leading-7 text-stone-600 sm:text-lg">
            Please leave your personal information and our expert consultants
            will contact you within 24 hours.
          </p>
        </div>

        <div
          className="relative mt-10 overflow-hidden border border-stone-800 bg-white px-5 py-8 text-white shadow-xl shadow-stone-950/10 sm:p-8 lg:p-16"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-white bg-[#0b0b0b]"
          />

          <p
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 top-1/2 hidden -translate-y-1/2 select-none text-[220px] font-extrabold leading-none text-white/[0.025] lg:block"
          >
            WE
          </p>

          <form className="relative z-10" onSubmit={onSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className={fieldLabelClass} htmlFor="contact-name">
                  Full Name
                </label>
                <input
                  id="contact-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="John Doe"
                  className={fieldControlClass}
                />
              </div>

              <div>
                <label className={fieldLabelClass} htmlFor="contact-phone">
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  className={fieldControlClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={fieldLabelClass} htmlFor="contact-email">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="contact@webie.vn"
                  className={fieldControlClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={fieldLabelClass} htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  placeholder="Tell us about your project or vision..."
                  className={`${fieldControlClass} min-h-[132px] resize-y py-4`}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-medium uppercase text-stone-400">
                  <ShieldCheck
                    size={14}
                    strokeWidth={1.8}
                    className="text-[#d8c97b]"
                    aria-hidden="true"
                  />
                  Secure data transmission enabled
                </p>

                <p
                  className={`mt-3 min-h-5 text-sm ${
                    errorMessage ? "text-red-300" : "text-green-600"
                  }`}
                  aria-live="polite"
                >
                  {errorMessage || successMessage}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-14 bg-[#d8c97b] px-10 text-xs font-semibold uppercase text-stone-950 transition hover:bg-[#efe6bf] focus:outline-none focus:ring-2 focus:ring-[#efe6bf] disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[200px]"
              >
                {loading ? "Sending" : "Send Request"}
              </button>
            </div>
          </form>
        </div>

        {/*<div className="mt-8 grid gap-5 md:grid-cols-3">*/}
        {/*  <article className="border border-stone-200 bg-white p-6">*/}
        {/*    <h3 className="text-xs font-semibold uppercase text-[#9d8948]">*/}
        {/*      Office*/}
        {/*    </h3>*/}
        {/*    <p className="mt-3 text-base font-semibold text-stone-950">*/}
        {/*      Dist 1, Ho Chi Minh City*/}
        {/*    </p>*/}
        {/*  </article>*/}

        {/*  <article className="border border-stone-200 bg-white p-6">*/}
        {/*    <h3 className="text-xs font-semibold uppercase text-[#9d8948]">*/}
        {/*      Contact*/}
        {/*    </h3>*/}
        {/*    <a*/}
        {/*      href="mailto:hello@webie.vn"*/}
        {/*      className="mt-3 inline-flex text-base font-semibold text-stone-950 transition hover:text-[#9d8948]"*/}
        {/*    >*/}
        {/*      hello@webie.vn*/}
        {/*    </a>*/}
        {/*  </article>*/}

        {/*  <article className="border border-stone-200 bg-white p-6">*/}
        {/*    <h3 className="text-xs font-semibold uppercase text-[#9d8948]">*/}
        {/*      Social*/}
        {/*    </h3>*/}
        {/*    <div className="mt-3 flex gap-5">*/}
        {/*      {socialLinks.map((link) => (*/}
        {/*        <a*/}
        {/*          key={link.label}*/}
        {/*          href={link.href}*/}
        {/*          aria-label={link.label}*/}
        {/*          className="text-base font-semibold text-stone-950 transition hover:text-[#9d8948]"*/}
        {/*        >*/}
        {/*          {link.short}*/}
        {/*        </a>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </article>*/}
        {/*</div>*/}
      </div>
    </section>
  );
}

export default ContactSection;
