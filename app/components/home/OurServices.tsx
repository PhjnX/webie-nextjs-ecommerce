// components/home/OurServices.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const services = [
  {
    title: "Digital VCards",
    href: "/products",
    image: "/images/services/personalized-greeting-cards.png",
    alt: "Premium stationery and greeting cards arranged on a warm desk",
  },
  {
    title: "Greeting Cards",
    href: "/products",
    image: "/images/services/website-templates.png",
    alt: "Laptop displaying a minimal website template on a marble desk",
    offset: "md:mt-14",
  },
  {
    title: "Website Templates",
    href: "/products",
    image: "/images/services/custom-services.png",
    alt: "Custom design materials, paper swatches, and a fountain pen on a dark desk",
  },
];

export default function OurServices() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-[1236px] px-6">
        <div className="mb-14 text-center md:mb-16">
          <h2 className="text-4xl font-medium text-black md:text-5xl">
            Our Services
          </h2>
          <div className="mx-auto mt-6 h-1 w-24 bg-[#efe6bf]" />
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className={`group relative block aspect-[4/5] overflow-hidden border border-white/5 bg-stone-900 ${
                service.offset ?? ""
              }`}
              aria-label={`${service.title} - explore`}
            >
              <Image
                src={service.image}
                alt={service.alt}
                fill
                sizes="(max-width: 768px) 100vw, 404px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9">
                <h3 className="max-w-xs text-2xl font-semibold leading-tight md:text-[27px]">
                  {service.title}
                </h3>
                <span className="mt-4 inline-flex items-center gap-2 text-base text-white/85 transition group-hover:text-white">
                  Explore
                  <ArrowRight
                    size={17}
                    strokeWidth={1.8}
                    className="transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
