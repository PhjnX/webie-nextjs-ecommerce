// components/ProductCardActions.tsx
"use client";

interface ProductCardActionsProps {
  iframeUrl: string;
  productName: string;
}

export default function ProductCardActions({
  iframeUrl,
  productName,
}: ProductCardActionsProps) {
  const handleRegister = () => {
    alert(`Kích hoạt luồng thanh toán cho gói: [${productName}]`);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <a
        href={iframeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 hover:border-stone-700 text-xs md:text-sm font-semibold py-3.5 px-4 rounded-xl transition duration-200"
      >
        Xem Bản Demo
      </a>
      <button
        onClick={handleRegister}
        className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs md:text-sm font-bold py-3.5 px-4 rounded-xl shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition duration-200"
      >
        Đăng Ký Mua
      </button>
    </div>
  );
}
