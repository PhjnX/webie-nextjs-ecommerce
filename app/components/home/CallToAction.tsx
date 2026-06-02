// components/home/CallToAction.tsx
import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="bg-stone-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white border border-stone-100 p-8 md:p-16 rounded text-center max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-4xl font-light text-stone-900 leading-normal mb-4">
            Khẳng định vị thế chuyên nghiệp <br />
            trên không gian số
          </h2>
          <p className="text-stone-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed font-light mb-8">
            Hãy liên hệ với đội ngũ thiết kế của Webie để sở hữu các giải pháp
            vCard, Website mang đậm dấu ấn riêng của bạn.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-widest font-medium py-4 px-10 rounded transition-all duration-300"
          >
            Liên hệ tư vấn chi tiết
          </Link>
        </div>
      </div>
    </section>
  );
}
