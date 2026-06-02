// components/home/CategoryShowcase.tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const categories = [
  {
    name: "Greeting Cards",
    desc: "Thiệp điện tử cá nhân hoá mang dấu ấn cá nhân tinh tế.",
    href: "/products",
    bg: "bg-amber-50/50 hover:bg-amber-50",
    border: "border-amber-100/40",
  },
  {
    name: "Website Templates",
    desc: "Giao diện website doanh nghiệp chuyên nghiệp chuẩn SEO.",
    href: "/products",
    bg: "bg-emerald-50/50 hover:bg-emerald-50",
    border: "border-emerald-100/40",
  },
  {
    name: "App Templates",
    desc: "Bộ UI Kit và mã nguồn ứng dụng di động tối ưu trải nghiệm.",
    href: "/products",
    bg: "bg-violet-50/50 hover:bg-violet-50",
    border: "border-violet-100/40",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="bg-white py-16 md:py-24 border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <h2 className="text-stone-400 text-[10px] tracking-[0.2em] uppercase mb-2">
              Định hướng sản phẩm
            </h2>
            <p className="font-serif text-2xl md:text-3xl font-light text-stone-900">
              Danh mục giải pháp số
            </p>
          </div>
          <Link
            href="/products"
            className="group text-xs text-stone-400 hover:text-stone-900 flex items-center gap-1 mt-4 md:mt-0 uppercase tracking-widest transition-colors"
          >
            Tất cả sản phẩm{" "}
            <ArrowUpRight
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className={`p-8 rounded border ${cat.border} ${cat.bg} flex flex-col justify-between h-64 transition-all duration-300`}
            >
              <div>
                <h3 className="font-serif text-lg font-medium text-stone-900 mb-3">
                  {cat.name}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed font-light">
                  {cat.desc}
                </p>
              </div>
              <Link
                href={cat.href}
                className="text-xs font-medium uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors mt-6 block"
              >
                Khám phá ngay →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
