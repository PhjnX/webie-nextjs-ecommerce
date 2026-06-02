// components/home/Hero.tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full flex items-center overflow-hidden border-b border-stone-100 bg-white">
      {/* 1. Ảnh nền Fullsize tràn màn hình */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/banner.png"
          alt="Webie Hero Banner"
          fill
          priority
          className="object-cover object-right md:object-center" // Căn lề ảnh tối ưu cho các màn hình khác nhau
        />

        {/* Tăng mạnh độ phủ trắng bên trái để che hoàn toàn xe đẩy/hộp quà, tạo nền sạch cho chữ */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/98 via-white/90 to-transparent md:via-white/80 md:to-transparent" />
      </div>

      {/* 2. Nội dung căn giữa dọc theo toàn màn hình (min-h-screen) */}
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full pt-24 pb-12 flex flex-col justify-center min-h-screen">
        <div className="max-w-2xl">
          {/* Slogan viết hoa, độ giãn chữ vừa phải, sắc nét và hiện đại */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 uppercase leading-[1.1] mb-6 font-sans">
            Personalized Digital<br />
            <span className="text-[#D8C97B]">Experiences</span>
          </h1>

          {/* Short description */}
          <p className="text-stone-500 text-xs md:text-sm lg:text-base leading-relaxed font-normal max-w-md mb-10 font-sans">
            Own unique vCards, websites and apps. We design, tailor content and
            provide end-to-end API integration to meet your needs with fast page
            load times.
          </p>

          {/* Nhóm nút tương tác */}
          <div className="flex flex-wrap gap-4 font-sans">
            <Link
              href="#collection"
              className="inline-flex items-center gap-2 bg-stone-900 hover:bg-[#D8C97B] hover:text-stone-950 text-white text-xs uppercase tracking-widest font-semibold py-3.5 px-7 rounded transition-all duration-300 shadow-md shadow-stone-950/5"
            >
              Explore products <ArrowRight size={14} />
            </Link>
            {/*<Link*/}
            {/*  href="/contact"*/}
            {/*  className="inline-flex items-center justify-center border border-stone-200 bg-white/60 backdrop-blur-sm hover:border-[#D8C97B] hover:text-[#D8C97B] text-stone-600 text-xs uppercase tracking-widest font-semibold py-3.5 px-7 rounded transition-all duration-300"*/}
            {/*>*/}
            {/*  Request custom design*/}
            {/*</Link>*/}
          </div>
        </div>
      </div>
    </section>
  );
}
