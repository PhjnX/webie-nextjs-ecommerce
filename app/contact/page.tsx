import type { Metadata } from "next";
import ContactSection from "@/app/components/contact/ContactSection";

export const metadata: Metadata = {
  title: "Contact Webie",
  description: "Request a Webie consultation for your digital product.",
};

export default function ContactPage() {
  return <ContactSection variant="page" />;
}
