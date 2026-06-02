// components/home/ValueProp.tsx
import { Zap, Smartphone, CheckCircle } from "lucide-react";

const values = [
  {
    icon: <Zap size={18} className="text-stone-600" />,
    title: "Instant performance",
    desc: "Pages load under 1s thanks to Next.js Server Components optimizations for a seamless experience.",
  },
  {
    icon: <Smartphone size={18} className="text-stone-600" />,
    title: "Perfect compatibility",
    desc: "Designs are tailored for every mobile viewport, optimizing every touchpoint for customers.",
  },
  {
    icon: <CheckCircle size={18} className="text-stone-600" />,
    title: "Simplified management",
    desc: "Data syncs directly with your Odoo ERP for easy updates and order tracking.",
  },
];

export default function ValueProp() {
  return (
    <section className="bg-stone-50 py-16 md:py-24 border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {values.map((item, index) => (
            <div key={index} className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-100 mb-6">
                {item.icon}
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 mb-3">
                {item.title}
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
