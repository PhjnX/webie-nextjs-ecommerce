// components/home/AboutUs.tsx
import Image from "next/image";
import { Globe, LinkIcon, Mail, Send } from "lucide-react";

const socialLinks = [
  { label: "Website", href: "/", icon: Globe },
  { label: "Email", href: "mailto:hello@webie.vn", icon: Mail },
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: LinkIcon },
  { label: "Telegram", href: "https://telegram.org", icon: Send },
];

export default function AboutUs() {
  return (
    <section id ="AboutUs" className="bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-[1126px] grid-cols-1 gap-12 px-6 lg:grid-cols-[1.08fr_0.86fr] lg:items-start lg:gap-[86px]">
        <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
          <Image
            src="/images/about/about-webie-consultation.png"
            alt="Webie consultation in a warm design studio lounge"
            fill
            sizes="(max-width: 1024px) 100vw, 576px"
            className="object-cover"
          />
        </div>

        <div className="lg:pt-1">
          <h2 className="text-3xl font-semibold leading-tight text-stone-950 md:text-4xl">
            About Webie E-Commerce
          </h2>
          <p className="mt-5 text-base font-light italic leading-relaxed text-stone-400">
            Delivering premium personalized digital experiences directly
            through our online studio.
          </p>

          <div className="mt-7 space-y-6 text-base font-light leading-relaxed text-stone-600">
            <p>
              At Webie, we help individuals and businesses build a polished
              digital presence through elegant vCards, greeting cards, and
              website templates tailored for each brand story.
            </p>
            <p>
              Our collection is crafted with a balance of refined visual design,
              practical workflows, and modern web performance, so every product
              feels effortless to launch and easy to maintain.
            </p>
            <p>
              We are committed to thoughtful consultation, fast delivery, and a
              seamless experience from first idea to final handoff.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-5 border-t border-stone-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold italic text-stone-950">
              Developed by <span className="text-red-700">Webie</span> @ 2026
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition hover:bg-stone-900 hover:text-white"
                >
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
