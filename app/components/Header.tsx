// components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, ChevronDown, Menu, X, User } from "lucide-react";

const productCategories = [
  {
    name: "Thiệp Điện Tử",
    desc: "Thiệp chúc mừng cá nhân hoá nghệ thuật",
    href: "/products",
    color: "text-stone-600",
    bg: "bg-stone-50",
  },
  {
    name: "Giao Diện Website",
    desc: "Mẫu website chuyên nghiệp chuẩn SEO",
    href: "/products",
    color: "text-stone-600",
    bg: "bg-stone-50",
  },
  {
    name: "Mẫu Ứng Dụng",
    desc: "Bộ UI Kit và mã nguồn ứng dụng di động",
    href: "/products",
    color: "text-stone-600",
    bg: "bg-stone-50",
  },
];

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Lắng nghe sự kiện cuộn trang để thay đổi Background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Thay đổi class từ sticky thành fixed và đổi màu nền linh hoạt theo trạng thái cuộn */}
      <header
        className={`fixed top-0 left-0 right-0 z-45 h-20 transition-all duration-350 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo - Giữ nguyên kích thước bạn đã chỉnh sửa */}
          <Link href="/" className="flex items-center h-full">
            <div className="relative h-22 w-32 md:w-36 flex items-center">
              <Image
                src="/images/logo.png"
                alt="Webie Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Điều hướng giữa */}
          <nav className="hidden md:flex items-center gap-3 h-full">
            <Link
              href="/"
              className="text-[13px] uppercase tracking-widest text-stone-600 hover:text-[#D8C97B] px-3 py-2 transition-colors font-semibold"
            >
              Trang chủ
            </Link>

            {/* Dropdown Sản phẩm */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-1.5 text-[13px] uppercase tracking-widest text-stone-600 hover:text-[#D8C97B] px-3 py-2 transition-colors font-semibold">
                Sản phẩm
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-white border border-stone-100 rounded-lg shadow-xl shadow-stone-100/40 py-2.5">
                    {productCategories.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center flex-shrink-0 border border-stone-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-600 group-hover:bg-[#D8C97B] transition-colors" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-stone-850 group-hover:text-[#D8C97B] transition-colors">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-stone-600 mt-0.5 leading-normal">
                            {cat.desc}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="border-t border-stone-100 mt-2.5 pt-2">
                      <Link
                        href="/products"
                        className="flex items-center px-4 py-2 hover:bg-stone-50 transition-colors group"
                      >
                        <span className="text-[11px] uppercase tracking-widest text-stone-500 group-hover:text-[#D8C97B] font-semibold transition-colors">
                          Tất cả sản phẩm →
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/about"
              className="text-[13px] uppercase tracking-widest text-stone-600 hover:text-[#D8C97B] px-3 py-2 transition-colors font-semibold"
            >
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className="text-[13px] uppercase tracking-widest text-stone-600 hover:text-[#D8C97B] px-3 py-2 transition-colors font-semibold"
            >
              Liên hệ
            </Link>
          </nav>

          {/* Nhóm công cụ bên phải */}
          <div className="hidden md:flex items-center gap-3">
            {/* Tài khoản */}
            <div className="relative group">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-stone-600 hover:text-[#D8C97B] hover:bg-stone-50/50 transition-all duration-200"
                aria-label="Tài khoản"
              >
                <User size={20} />
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-stone-900 text-[10px] text-white rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap tracking-widest uppercase z-50">
                Đăng nhập
              </div>
            </div>

            <div className="w-px h-5 bg-stone-200/50" />

            {/* Giỏ hàng */}
            <Link
              href="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-stone-600 hover:text-[#D8C97B] hover:bg-stone-50/50 transition-all duration-200"
            >
              <ShoppingCart size={20} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#D8C97B] rounded-full" />
            </Link>
          </div>

          {/* Menu Di Động */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-stone-500 rounded-full hover:bg-stone-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Thực đơn di động */}
        {mobileOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white px-6 py-4 flex flex-col gap-3 shadow-lg">
            <Link
              href="/"
              className="text-sm uppercase tracking-wider text-stone-600 hover:text-[#D8C97B] py-2 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/products"
              className="text-sm uppercase tracking-wider text-stone-600 hover:text-[#D8C97B] py-2 transition-colors"
            >
              Sản phẩm
            </Link>
            {productCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="text-xs text-stone-600 hover:text-[#D8C97B] pl-4 py-1 transition-colors"
              >
                — {cat.name}
              </Link>
            ))}
            <Link
              href="/about"
              className="text-sm uppercase tracking-wider text-stone-500 hover:text-[#D8C97B] py-2 transition-colors"
            >
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className="text-sm uppercase tracking-wider text-stone-500 hover:text-[#D8C97B] py-2 transition-colors"
            >
              Liên hệ
            </Link>

            <div className="flex gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setIsLoginOpen(true);
                }}
                className="flex-1 text-center text-xs uppercase tracking-widest text-stone-600 hover:text-[#D8C97B] py-3 border border-stone-200 rounded font-semibold transition-colors"
              >
                Đăng nhập
              </button>
              <Link
                href="/cart"
                className="w-12 flex items-center justify-center border border-stone-200 rounded text-stone-600 hover:text-[#D8C97B] transition-colors"
              >
                <ShoppingCart size={20} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Pop-up Đăng nhập */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 md:p-10 relative shadow-2xl border border-stone-100/80 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-stone-600 hover:text-[#D8C97B] hover:bg-stone-50 rounded-full transition-all"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl font-light tracking-wide text-stone-900">
                Đăng Nhập
              </h2>
              <p className="font-serif italic text-xs text-stone-600 mt-1.5">
                Khám phá không gian sản phẩm số tinh tế
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsLoginOpen(false);
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-stone-600 mb-2 font-medium">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-white border border-stone-200/80 rounded-lg text-xs placeholder-stone-300 focus:outline-none focus:border-[#D8C97B] focus:ring-1 focus:ring-[#D8C97B] transition-all font-sans"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-stone-600 font-medium">
                    Mật khẩu
                  </label>
                  <a
                    href="#"
                    className="text-[10px] text-stone-600 hover:text-[#D8C97B] transition-colors font-medium"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-stone-200/80 rounded-lg text-xs placeholder-stone-300 focus:outline-none focus:border-[#D8C97B] focus:ring-1 focus:ring-[#D8C97B] transition-all"
                />
              </div>

              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2.5 text-xs text-stone-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-[#D8C97B] accent-stone-900"
                  />
                  Duy trì đăng nhập
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-[#D8C97B] hover:text-stone-950 text-white text-xs uppercase tracking-[0.2em] font-semibold py-3.5 rounded-lg transition-all duration-300 shadow-lg shadow-stone-950/10 hover:shadow-stone-950/5 active:scale-[0.99] mt-2"
              >
                Truy cập tài khoản
              </button>
            </form>

            <div className="relative my-8 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100"></div>
              </div>
              <span className="relative px-3 bg-white text-[10px] uppercase tracking-widest text-stone-300">
                Hoặc tiếp tục với
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 border border-stone-200 hover:border-[#D8C97B] hover:text-[#D8C97B] rounded-lg py-2.5 text-xs text-stone-600 transition-all font-medium">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-11 0-.746-.08-1.32-.176-1.895H12.24Z"
                  />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 border border-stone-200 hover:border-[#D8C97B] hover:text-[#D8C97B] rounded-lg py-2.5 text-xs text-stone-600 transition-all font-medium">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.1.09 2.23-.58 2.95-1.39Z"
                  />
                </svg>
                Apple
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-600">
                Thành viên mới?{" "}
                <a
                  href="#"
                  className="text-stone-900 hover:text-[#D8C97B] hover:underline font-semibold transition-colors"
                >
                  Tạo tài khoản tại đây
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
