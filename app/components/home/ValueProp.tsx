// components/home/ValueProp.tsx
import { Zap, Smartphone, CheckCircle } from "lucide-react";

const values = [
  {
    icon: <Zap size={18} className="text-stone-600" />,
    title: "Hiệu năng tức thì",
    desc: "Tải trang dưới 1 giây nhờ tối ưu hóa mã nguồn Next.js Server Components, mang lại trải nghiệm không gián đoạn.",
  },
  {
    icon: <Smartphone size={18} className="text-stone-600" />,
    title: "Tương thích tuyệt đối",
    desc: "Giao diện được may đo chuẩn xác cho từng kích thước màn hình di động, tối ưu hóa mọi điểm chạm của khách hàng.",
  },
  {
    icon: <CheckCircle size={18} className="text-stone-600" />,
    title: "Quản trị tinh giản",
    desc: "Dữ liệu được đồng bộ hóa trực tiếp với hệ thống Odoo ERP, giúp cập nhật thông tin và theo dõi đơn hàng dễ dàng.",
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
