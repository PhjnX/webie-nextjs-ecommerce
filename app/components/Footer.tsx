import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-stone-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span className="font-serif text-lg font-bold tracking-widest text-stone-900">
                WEBIE
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-light">
              Personalized digital products for professionals and businesses worldwide.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-stone-900 font-medium mb-4">
              Products
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                "Greeting Cards",
                "Website Templates",
                "App Templates",
                "All products",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/products"
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-stone-900 font-medium mb-4">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-stone-900 font-medium mb-4">
              Contact
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li className="text-xs text-stone-400">hello@webie.vn</li>
              <li className="text-xs text-stone-400">
                Ho Chi Minh City, Vietnam
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-stone-300">
            © {new Date().getFullYear()} Webie VietNam. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
