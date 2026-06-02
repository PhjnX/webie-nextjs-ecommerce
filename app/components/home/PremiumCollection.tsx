// components/home/PremiumCollection.tsx
"use client";

import { Product } from "../../../services/product";

interface PremiumCollectionProps {
  products: Product[];
}

export default function PremiumCollection({
  products,
}: PremiumCollectionProps) {
  const handlePurchase = (name: string) => {
    alert(`Kích hoạt luồng thanh toán cho gói: [${name}]`);
  };

  return (
    <section
      id="collection"
      className="bg-stone-50 py-20 md:py-28 scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-stone-400 text-[10px] tracking-[0.2em] uppercase block mb-3">
            BST chọn lọc
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-stone-900">
            Digital vCards tiêu biểu
          </h2>
          <p className="text-stone-400 text-xs mt-3 leading-relaxed font-light">
            Sản phẩm được đồng bộ thời gian thực từ hệ thống Odoo ERP & NestJS,
            sẵn sàng bàn giao và kích hoạt trong ngày.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white border border-stone-200/60 rounded">
            <p className="text-stone-400 text-xs font-light">
              Chưa tìm thấy sản phẩm vCard nào. Bạn vui lòng kiểm tra lại kết
              nối API.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-stone-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Cuộn ảnh dài */}
                <div className="relative h-80 w-full overflow-y-auto bg-stone-100 border-b border-stone-100 scrollbar-thin scrollbar-thumb-stone-200 hover:scrollbar-thumb-stone-300">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-auto object-cover object-top"
                  />
                </div>

                {/* Thông tin */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg md:text-xl font-normal text-stone-900 group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-stone-400 text-xs leading-relaxed mt-4 font-light">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-stone-100">
                    <div className="flex justify-between items-baseline mb-6">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider font-light">
                        Giá dịch vụ trọn gói
                      </span>
                      <span className="text-xl font-medium text-stone-900">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.list_price)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <a
                        href={product.iframe_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 text-xs font-medium py-3 rounded transition-all duration-200"
                      >
                        Bản Demo
                      </a>
                      <button
                        onClick={() => handlePurchase(product.name)}
                        className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium py-3 rounded transition-all duration-200"
                      >
                        Đăng Ký Mua
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
