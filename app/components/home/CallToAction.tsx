"use client";

// components/home/CallToAction.tsx
import { type FormEvent, useState } from "react";

function CallToAction() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const form = event.currentTarget;
    const formValues = Object.fromEntries(new FormData(form).entries());

    setLoading(true);
    setSuccessMessage("");

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
      });

      setSuccessMessage("Thank you for contacting us!");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending your message...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-white px-2 py-4 sm:px-4 sm:py-5">
      <div className="relative mx-auto max-w-[1300px] overflow-hidden bg-[#414140] px-6 py-12 text-center sm:px-10 md:py-16 lg:py-[58px]">

        <div className="relative z-10 mx-auto max-w-[860px]">
          <h2 className="text-2xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-[50px]">
            Register for a consultation
          </h2>
          <p className="mx-auto mt-5 max-w-[820px] text-base font-light text-white/55 sm:text-lg md:text-1xl">
            Please leave your personal information and our consultants will
            contact you
          </p>

          <form
            className="mx-auto mt-6 flex max-w-[850px] flex-col gap-4"
            onSubmit={onSubmit}
          >
            <label className="sr-only" htmlFor="consultation-name">
              Full Name
            </label>
            <input
              id="consultation-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Full Name"
              className="h-20 w-full border border-white/20 bg-[#aba6a6] px-8 text-xl text-black outline-none transition placeholder:text-[#858b9b] focus:border-white/50"
            />

            <label className="sr-only" htmlFor="consultation-phone">
              Phone Number
            </label>
            <input
              id="consultation-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="Phone Number"
              className="h-20 w-full border border-white/20 bg-[#aba6a6] px-8 text-xl text-black outline-none transition placeholder:text-[#858b9b] focus:border-white/50"
            />

            <label className="sr-only" htmlFor="consultation-email">
              Email Address
            </label>
            <input
              id="consultation-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email Address"
              className="h-20 w-full border border-white/20 bg-[#aba6a6] px-8 text-xl text-black outline-none transition placeholder:text-[#858b9b] focus:border-white/50"
            />

            <label className="sr-only" htmlFor="consultation-message">
              Message
            </label>
            <input
                id="consultation-message"
                name="text"
                type="text"
                placeholder="Message"
                className="h-30 w-full border border-white/20 bg-[#aba6a6] px-8 text-xl text-black outline-none transition placeholder:text-[#858b9b] focus:border-white/50"
            />

            <button
              type="submit"
              disabled={loading}
              className="mx-auto mt-1 h-15 w-40 bg-white text-1xl font-medium text-stone-900 transition hover:bg-[#efe6bf] focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending" : "Send Request"}
            </button>

            <p className="min-h-5 text-sm text-white/60" aria-live="polite">
              {successMessage}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
